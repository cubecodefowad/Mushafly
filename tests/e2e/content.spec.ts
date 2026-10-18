import { expect, test } from "@playwright/test";

const DISCLAIMER_OPENING =
  "We have taken great care to preserve the accuracy and integrity of the Quranic text";
const DISCLAIMER_CLOSING = "May Allah accept this effort and forgive us for any shortcomings.";

test("accuracy page carries the full disclaimer and the source link", async ({ page }) => {
  await page.goto("/accuracy/");
  await expect(page.getByRole("heading", { level: 1, name: "Accuracy and Sources" })).toBeVisible();

  const main = page.locator("main");
  await expect(main).toContainText(DISCLAIMER_OPENING);
  await expect(main).toContainText("If you notice any discrepancy");
  await expect(main).toContainText(DISCLAIMER_CLOSING);
  await expect(
    main.getByRole("link", { name: "QuranJSON repository" }),
  ).toHaveAttribute("href", "https://github.com/semarketir/quranjson");
});

test("about page carries the disclaimer and an email contact", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { level: 1, name: "About Mushafly" })).toBeVisible();

  const main = page.locator("main");
  await expect(main).toContainText(DISCLAIMER_OPENING);
  await expect(main).toContainText(DISCLAIMER_CLOSING);

  await expect(page.locator("#contact")).toBeVisible();
  await expect(
    main.getByRole("link", { name: "hello@mushafly.com" }),
  ).toHaveAttribute("href", "mailto:hello@mushafly.com");

  const html = await page.content();
  expect(html).not.toContain("cubecodefowad");
});

test("tajweed page explains every highlight and every sign", async ({ page }) => {
  await page.goto("/tajweed/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tajweed and marks" }),
  ).toBeVisible();

  const main = page.locator("main");
  await expect(main).toContainText("Madd · 2 counts");
  await expect(main).toContainText("Idghaam with Ghunnah");
  await expect(main).toContainText("Waqf lāzim");
  await expect(main).toContainText("Sajdah");
  await expect(main).toContainText("Rub' al-ḥizb");

  await expect(main.locator('ul a[href^="/surah/"]')).toHaveCount(15);
  await expect(main.getByRole("link", { name: "7:206", exact: true })).toHaveAttribute(
    "href",
    "/surah/7/#verse-206",
  );
});

test("the reader keeps the key beside the ayat while scrolling", async ({ page }) => {
  await page.goto("/surah/2/");
  const key = page.getByRole("complementary", { name: "Tajweed and mark key" });
  await expect(key).toBeVisible();
  await expect(key).toContainText("Madd · 2 counts");
  await expect(key).toContainText("Sajdah");
  await expect(key.getByRole("link", { name: "Full guide" })).toHaveAttribute(
    "href",
    "/tajweed/",
  );

  await page.evaluate(() => window.scrollTo(0, 4000));
  await expect(key).toBeInViewport();

  await page.goto("/surah/2/#verse-286");
  await expect(key).toBeInViewport();
});

test("reader footer shows the disclaimer and links to the accuracy page", async ({ page }) => {
  await page.goto("/surah/1/");

  const footerNote = page.locator(".reader-column").last().getByRole("heading", {
    name: "Accuracy and Sources",
  });
  await footerNote.scrollIntoViewIfNeeded();
  await expect(footerNote).toBeVisible();

  const block = page.locator("main .reader-column").last();
  await expect(block).toContainText(DISCLAIMER_OPENING);
  await expect(block).toContainText(DISCLAIMER_CLOSING);

  await block.getByRole("link", { name: "Read the full accuracy note" }).click();
  await expect(page).toHaveURL(/\/accuracy\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Accuracy and Sources" })).toBeVisible();
});

test("footer navigation reaches the new pages", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");

  await footer.getByRole("link", { name: "About", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "About Mushafly" })).toBeVisible();

  await page.getByRole("contentinfo").getByRole("link", { name: "Tajweed and marks" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Tajweed and marks" }),
  ).toBeVisible();

  await page.getByRole("contentinfo").getByRole("link", { name: "Accuracy and Sources" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Accuracy and Sources" })).toBeVisible();
});
