import { expect, test } from "@playwright/test";

test("the home page links to Hadithly, which lists every collection", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Hadithly The Six Books/ }).click();
  await expect(page).toHaveURL(/\/hadithly\/$/);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The sayings, kept beside the Quran.",
  );
  await expect(page.locator(".collection-card")).toHaveCount(10);

  const cards = page.locator(".collection-card");
  await expect(cards.first()).toContainText("Sahih al-Bukhari");
  await expect(cards.first()).toContainText("صحيح البخاري");
  await expect(page.locator(".collection-card").filter({ hasText: "Al-Muwatta" })).toHaveCount(1);

  // Every translation the datasets publish is named on the landing page.
  const translations = page.getByRole("list", { name: "Translations available" });
  await expect(translations).toContainText("Urdu");
  await expect(translations).toContainText("Turkish");
  await expect(translations).toContainText("Tamil");
});

test("a collection lists its books and the filter narrows them", async ({ page }) => {
  await page.goto("/hadithly/bukhari/");
  // The filter is a controlled input, so it must be typed into after React has
  // attached: WebKit ignores a programmatic fill that arrives before hydration.
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { level: 1, name: "صحيح البخاري" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The books" })).toBeVisible();
  await expect(page.getByText("Showing 97 of 97 books.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Revelation/ })).toBeVisible();

  // Typing before hydration is complete would be dropped by a controlled
  // input, so retry until the filter has actually taken the value.
  const filter = page.getByRole("searchbox", { name: "Filter the books" });
  await filter.fill("");
  await filter.fill("tawheed");
  await expect(page.getByText("Showing 1 of 97 books.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Oneness/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Revelation/ })).toHaveCount(0);

  await page.getByRole("link", { name: /Oneness/ }).click();
  await expect(page).toHaveURL(/\/hadithly\/bukhari\/97\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Oneness");
});

test("a book renders the Arabic first and the translation beneath it", async ({ page }) => {
  await page.goto("/hadithly/bukhari/1/");

  await expect(page.getByRole("heading", { level: 1, name: "Revelation" })).toBeVisible();
  await expect(page.getByText("7 hadiths · Arabic and English")).toBeVisible();

  const articles = page.locator(".hadith-article");
  await expect(articles).toHaveCount(7);

  const first = articles.first();
  await expect(first.locator(".hadith-arabic")).toHaveAttribute("dir", "rtl");
  await expect(first).toContainText("The reward of deeds depends upon the intentions");
  await expect(first.locator(".translation-text")).toHaveCount(1);

  // The translation can be hidden without losing the Arabic.
  await page.getByRole("button", { name: "Translation on" }).click();
  await expect(page.locator(".translation-text")).toHaveCount(0);
  await expect(first.locator(".hadith-arabic")).toBeVisible();
  await page.getByRole("button", { name: "Translation off" }).click();
  await expect(first.locator(".translation-text")).toHaveCount(1);
});

test("any published translation can be read, one book at a time", async ({ page }) => {
  await page.goto("/hadithly/bukhari/1/");
  await page.waitForLoadState("networkidle");

  const picker = page.getByRole("combobox", { name: "Translation language" });
  await expect(picker.locator("option")).toHaveCount(8);
  await expect(picker).toHaveValue("en");

  await picker.selectOption("ur");
  const urdu = page.locator('.translation-text[lang="ur"]').first();
  await expect(urdu).toBeVisible();
  await expect(urdu).toHaveAttribute("dir", "rtl");
  await expect(urdu).toContainText(/[\u0600-\u06FF]/);
  await expect(page.getByText("7 hadiths · Arabic and Urdu")).toBeVisible();

  // The choice follows the reader into the next book.
  await page.goto("/hadithly/bukhari/2/");
  await expect(page.getByRole("combobox", { name: "Translation language" })).toHaveValue("ur");
  await expect(page.locator('.translation-text[lang="ur"]').first()).toBeVisible();

  // A collection the datasets never translated into Urdu falls back to
  // English and says which languages it does have, rather than pretending.
  await page.goto("/hadithly/qudsi/1/");
  const present = page.getByRole("combobox", { name: "Translation language" });
  await expect(present.locator("option")).toHaveCount(2);
  await expect(page.locator('.translation-text[lang="en"]').first()).toBeVisible();
  await expect(page.getByText(/Arabic and English$/)).toBeVisible();
});

test("published gradings name the scholar who issued them", async ({ page }) => {
  await page.goto("/hadithly/tirmidhi/1/");

  const chip = page.locator(".grade-chip").first();
  await expect(chip).toBeVisible();
  await expect(chip).toContainText(/Sahih|Hasan|Daif/);
  await expect(chip).toContainText(/Shakir|Albani|Zai|Maarouf/);
  expect(["sahih", "hasan", "weak", "other"]).toContain(await chip.getAttribute("data-tone"));
});

test("a long book opens a window and can reveal more", async ({ page }) => {
  await page.goto("/hadithly/bukhari/64/");

  await expect(page.locator(".hadith-article")).toHaveCount(25);
  await page.getByRole("button", { name: "Read 25 more" }).click();
  await expect(page.locator(".hadith-article")).toHaveCount(50);
});

test("a deep link opens the book at the cited hadith", async ({ page }) => {
  await page.goto("/hadithly/bukhari/64/#hadith-4200");

  const target = page.locator("#hadith-4200");
  await expect(target).toBeVisible();
  await expect(target).toBeInViewport();
  expect(await page.locator(".hadith-article").count()).toBeGreaterThan(100);
});

test("Hadithly remembers where a reader stopped", async ({ page }) => {
  await page.goto("/hadithly/nawawi/1/");
  await expect(page.locator(".hadith-article")).toHaveCount(25);

  await page.locator("#hadith-3").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  await page.goto("/hadithly/");
  const resume = page.getByRole("link", { name: /Continue reading/ });
  await expect(resume).toBeVisible();
  await expect(resume).toContainText("Forty Hadith of al-Nawawi");
  await expect(resume).toHaveAttribute("href", /^\/hadithly\/nawawi\/1\/#hadith-\d+$/);

  await resume.click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Forty Hadith");
});

test("the sources note explains Hadithly's provenance and translations", async ({ page }) => {
  await page.goto("/accuracy/");
  const section = page.locator("#hadithly").locator("..");
  await expect(section).toContainText("hadith-api");
  await expect(section).toContainText("not revelation");
  await expect(section).toContainText("Urdu");
});
