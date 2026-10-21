import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/** Reads a packaged translation so the assertion uses the source text itself. */
function translationVerse(id: string, surah: number, verse: number): string {
  const file = path.join(
    process.cwd(),
    "public",
    "quran",
    "translation",
    id,
    `${String(surah).padStart(3, "0")}.json`,
  );
  const payload = JSON.parse(fs.readFileSync(file, "utf8")) as {
    verse: Record<string, string>;
  };
  return payload.verse[`verse_${verse}`];
}

test("home lists all 114 surahs and offers a starting point", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A quiet place to read the Quran." })).toBeVisible();
  await expect(page.locator("ol li")).toHaveCount(114);
  await expect(page.getByRole("link", { name: "Start reading" }).first()).toBeVisible();
});

test("surah reader keeps Arabic and English separate and aligned to source", async ({ page }) => {
  await page.goto("/surah/2/");
  await expect(page.locator("article.verse")).toHaveCount(287);

  const bismillah = page.locator("#bismillah .quran-text");
  await expect(bismillah).toHaveAttribute("dir", "rtl");
  await expect(bismillah).toHaveAttribute("lang", "ar");
  await expect(bismillah).toHaveText("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");

  const verse = page.locator("#verse-1 .quran-text");
  await expect(verse).toHaveText("الٓمٓ");
  await expect(page.locator("#verse-1 .translation-text")).toHaveAttribute("lang", "en");
  await expect(page.locator("#verse-1 .translation-text")).toHaveAttribute("dir", "ltr");
  await expect(
    page.locator("#verse-1").getByText("Tajweed highlighting is unavailable for this verse"),
  ).toBeVisible();

  await expect(page.locator(".tajweed-mark").first()).toBeVisible();
});

/**
 * Opens a translation picker from its trigger and chooses a dataset. The
 * picker is a dialog, because a native select menu cannot be themed and a
 * 68-entry OS list is taller than most windows.
 */
async function pickTranslation(
  page: Page,
  triggerName: string,
  query: string,
  value: string,
) {
  await page.getByRole("button", { name: triggerName }).click();
  const picker = page.getByRole("dialog", { name: "Choose a translation" });
  await picker.getByRole("searchbox", { name: "Search translations" }).fill(query);
  await picker.locator(`[data-value="${value}"]`).click();
  await expect(picker).toBeHidden();
}

test("the reader switches translation language and remembers it", async ({ page }) => {
  await page.goto("/surah/1/");
  const trigger = page.getByRole("button", { name: "Translation language" });
  await expect(trigger).toContainText("Itani");

  const verse = page.locator("#verse-1 .translation-text");
  await expect(verse).toHaveAttribute("lang", "en");
  await expect(verse).toHaveAttribute("dir", "ltr");

  await pickTranslation(page, "Translation language", "Bahasa", "id");
  await expect(verse).toHaveAttribute("lang", "id");
  await expect(verse).toContainText("Dengan menyebut nama Allah");
  await expect(trigger).toContainText("Bahasa Indonesia");

  await pickTranslation(page, "Translation language", "Muyassar", "ar");
  await expect(verse).toHaveAttribute("lang", "ar");
  await expect(verse).toHaveAttribute("dir", "rtl");
  await expect(verse).toContainText("سورة الفاتحة");

  await page.reload();
  await expect(trigger).toContainText("Muyassar");
  await expect(page.locator("#verse-1 .translation-text")).toHaveAttribute("lang", "ar");

  // "Off" is a separate choice, shown only while the search box is empty.
  await trigger.click();
  const offPicker = page.getByRole("dialog", { name: "Choose a translation" });
  await offPicker.locator('[data-value="off"]').click();
  await expect(offPicker).toBeHidden();
  await expect(page.locator("#verse-1 .translation-text")).toHaveCount(0);
  await pickTranslation(page, "Translation language", "Itani", "en");
  await expect(page.locator("#verse-1 .translation-text")).toHaveAttribute("lang", "en");

  // The reading-settings sheet offers the same picker and updates the toolbar.
  await page.getByRole("button", { name: "Open reading settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Reading settings" });
  await dialog.getByRole("button", { name: "Translation", exact: true }).click();
  const picker = page.getByRole("dialog", { name: "Choose a translation" });
  await picker.getByRole("searchbox", { name: "Search translations" }).fill("Ministry");
  await picker.locator('[data-value="id.indonesian"]').click();
  await expect(picker).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toContainText("Indonesian Ministry");
  await expect(page.locator("#verse-1 .translation-text")).toHaveAttribute("lang", "id");
});

test("the reader offers the Tanzil datasets and renders their own text", async ({
  page,
}) => {
  await page.goto("/surah/1/");
  const trigger = page.getByRole("button", { name: "Translation language" });
  const verse = page.locator("#verse-1 .translation-text");

  await pickTranslation(page, "Translation language", "Junagarhi", "ur.junagarhi");
  await expect(verse).toHaveAttribute("lang", "ur");
  await expect(verse).toHaveAttribute("dir", "rtl");
  await expect(verse).toHaveText(translationVerse("ur.junagarhi", 1, 1));

  await pickTranslation(page, "Translation language", "Muhiuddin", "bn.bengali");
  await expect(verse).toHaveAttribute("lang", "bn");
  await expect(verse).toHaveAttribute("dir", "ltr");
  await expect(verse).toHaveText(translationVerse("bn.bengali", 1, 1));

  await page.reload();
  await expect(trigger).toContainText("Muhiuddin Khan");
  await expect(page.locator("#verse-1 .translation-text")).toHaveText(
    translationVerse("bn.bengali", 1, 1),
  );
});

test("the translation picker is styled, searchable and keyboard dismissible", async ({
  page,
}) => {
  await page.goto("/surah/1/");
  await page.getByRole("button", { name: "Translation language" }).click();
  const picker = page.getByRole("dialog", { name: "Choose a translation" });
  await expect(picker).toBeVisible();

  const search = picker.getByRole("searchbox", { name: "Search translations" });
  await expect(search).toBeFocused();
  await expect(picker.getByRole("option")).toHaveCount(68);

  // The dialog is themed, not an operating-system menu.
  const surface = await picker.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(surface).not.toBe("rgba(0, 0, 0, 0)");

  await search.fill("urdu");
  await expect(picker.getByRole("option")).toHaveCount(6);
  await search.fill("zzzz");
  await expect(picker.getByText("No translation matches")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(picker).toBeHidden();
  await expect(page.locator("#verse-1 .translation-text")).toHaveAttribute("lang", "en");
});

test("tajweed can be disabled and restored", async ({ page }) => {
  await page.goto("/surah/1/");
  await expect(page.locator(".tajweed-mark").first()).toBeVisible();
  const toggle = page.getByRole("button", { name: "Tajweed highlighting" });
  await toggle.click();
  await expect(page.locator(".tajweed-mark")).toHaveCount(0);
  await toggle.click();
  await expect(page.locator(".tajweed-mark").first()).toBeVisible();
});

test("bookmarks persist after reload and appear on the bookmarks page", async ({ page }) => {
  await page.goto("/surah/1/");
  const add = page.locator('#verse-1 button[aria-label^="Bookmark verse"]');
  await add.click();
  await expect(page.locator('#verse-1 button[aria-label^="Remove bookmark"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.reload();
  await expect(page.locator('#verse-1 button[aria-label^="Remove bookmark"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("/bookmarks/");
  await expect(page.locator("main ul li")).toHaveCount(1);
  await expect(page.locator("main")).toContainText("Al-Fatiha");
  await expect(page.locator("main")).toContainText("In the name of God");

  await page.getByRole("button", { name: "Remove bookmark" }).click();
  await page.getByRole("button", { name: "Confirm remove bookmark" }).click();
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();
});

test("Arabic and English search return traceable verse references", async ({ page }) => {
  await page.goto("/search/");
  const input = page.getByRole("searchbox", { name: "Search the Quran" });

  const typeQuery = async (text: string) => {
    await input.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText(text);
  };

  await typeQuery("الرحمن");
  await expect(page.getByText(/\d+ matches/)).toBeVisible();
  await expect(page.locator("ol li").first()).toContainText(/Surah 1/i);
  await expect(page.locator("ol li").first().locator('[dir="rtl"]')).toBeVisible();

  await typeQuery("mercy");
  await expect(page).toHaveURL(/q=mercy/);
  await expect(page.locator("ol li").first()).toContainText(/mercy/i);
  await expect(page.locator("ol li").first().locator('[dir="ltr"]')).toBeVisible();

  await page.locator("ol li").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/surah\/\d+\/#verse-\d+/);
});

test("search index downloads only once a query needs it", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("search-index.json")) requests.push(request.url());
  });

  await page.goto("/search/");
  await expect(page.getByText("Enter at least two letters", { exact: false })).toBeVisible();
  await page.waitForTimeout(600);
  expect(requests).toEqual([]);

  await page.getByRole("searchbox", { name: "Search the Quran" }).click();
  await page.keyboard.insertText("light");
  await expect(page.locator("ol li").first()).toBeVisible();
  expect(requests.length).toBe(1);
});

test("the Mushafly mark follows the theme and browser icons are declared", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushafly.settings.v1", JSON.stringify({ theme: "light" }));
  });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Mushafly home" })).toBeVisible();
  await expect(page.locator("header")).toContainText("Mushafly");

  const markFor = () =>
    page.evaluate(() => {
      const mark = document.querySelector(".brand-mark");
      return mark ? getComputedStyle(mark).backgroundImage : "none";
    });

  // The theme is applied by a layout effect, so poll instead of reading the
  // computed style in the same tick as the click.
  await expect.poll(markFor).toContain("mark-light.png");

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect.poll(markFor).toContain("mark-dark.png");

  const markLoads = await page.evaluate(async () => {
    const url = "/brand/mark-dark.png";
    return new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
      image.onerror = () => resolve(false);
      image.src = url;
    });
  });
  expect(markLoads).toBe(true);

  const icons = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="icon"]')].map((link) => ({
      href: link.getAttribute("href") ?? "",
      media: link.getAttribute("media") ?? "",
    })),
  );
  expect(icons.some((icon) => icon.href.includes("favicon-light-32.png"))).toBe(true);
  expect(
    icons.some(
      (icon) =>
        icon.href.includes("favicon-dark-32.png") &&
        icon.media === "(prefers-color-scheme: dark)",
    ),
  ).toBe(true);

  for (const asset of [
    "/brand/favicon-light-32.png",
    "/brand/favicon-dark-32.png",
    "/brand/apple-touch-icon-180.png",
  ]) {
    expect((await page.request.get(asset)).ok(), asset).toBe(true);
  }
});

const LEGAL_PAGES = [
  { path: "/terms/", heading: "Terms of Service" },
  { path: "/privacy/", heading: "Privacy Policy" },
];

for (const legal of LEGAL_PAGES) {
  test(`${legal.heading} is reachable, titled and linked from the footer`, async ({ page }) => {
    await page.goto(legal.path);
    await expect(page.getByRole("heading", { level: 1, name: legal.heading })).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(`${legal.heading} · Mushafly`));

    await page.goto("/");
    const footer = page.getByRole("navigation", { name: "Footer" });
    await footer.getByRole("link", { name: legal.heading }).click();
    await expect(page).toHaveURL(new RegExp(`${legal.path}$`));
  });
}

test("the privacy policy names the keys it stores", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByText("mushafly.bookmarks.v1")).toBeVisible();
  await expect(page.getByText("mushafly.lastRead.v1")).toBeVisible();
  await expect(page.getByText("mushafly.settings.v1")).toBeVisible();
});

test("bookmarks and theme saved before the rename still load", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ayah.settings.v1", JSON.stringify({ theme: "dark" }));
    localStorage.setItem(
      "ayah.bookmarks.v1",
      JSON.stringify([
        {
          id: "legacy-bookmark",
          reference: { surahNumber: 2, verseNumber: 255 },
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    );
  });

  await page.goto("/bookmarks/");
  await expect(page.locator("main ul li")).toHaveCount(1);
  await expect(page.locator("main")).toContainText("Al-Baqara");
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("theme choice applies immediately and survives reload", async ({ page }) => {
  await page.goto("/");
  const root = page.locator("html");
  const start = await root.getAttribute("class");
  await page.getByRole("button", { name: /Switch to (dark|light) theme/ }).click();
  await expect(root).not.toHaveAttribute("class", start ?? "");
  const after = await root.getAttribute("class");
  await page.reload();
  await expect(root).toHaveAttribute("class", after ?? "");
});

/**
 * The reader's controls are client components, so a click before React
 * hydrates does nothing. WebKit is slow enough to expose that, so wait until
 * the first play button has hydrated props before pressing it.
 */
async function waitForReaderHydration(page: Page) {
  await page.waitForFunction(() => {
    const button = document.querySelector('button[aria-label="Play verse 1"]');
    return Boolean(
      button && Object.keys(button).some((key) => key.startsWith("__reactProps")),
    );
  });
}

test("the selected reciter changes the audio source", async ({ page, browserName }) => {
  await page.goto("/settings/");
  const alafasy = page.getByRole("radio", { name: /Mishary Rashid Alafasy/ });
  await alafasy.check();
  await expect(alafasy).toBeChecked();

  // everyayah answers per-ayah files named <surah:3><ayah:3>.mp3. WebKit
  // neither routes nor reports media requests, so only intercept elsewhere.
  const requested: string[] = [];
  if (browserName !== "webkit") {
    await page.route("https://everyayah.com/**", (route) => {
      requested.push(route.request().url());
      return route.abort();
    });
  }

  await page.goto("/surah/1/");
  await waitForReaderHydration(page);
  await page.getByRole("button", { name: "Play verse 1" }).click();

  if (browserName === "webkit") {
    // The player started, which can only happen once the everyayah file loads;
    // the filename itself is covered by the unit tests.
    await expect(page.locator(".audio-bar")).toContainText("Playing Verse 1");
  } else {
    await expect.poll(() => requested.length).toBeGreaterThan(0);
    expect(requested[0]).toContain("/data/Alafasy_128kbps/001001.mp3");
  }

  // The choice is local state, so it survives a reload.
  await page.reload();
  await page.goto("/settings/");
  await expect(page.getByRole("radio", { name: /Mishary Rashid Alafasy/ })).toBeChecked();
});

test("reading settings dialog is keyboard dismissible", async ({ page }) => {
  await page.goto("/surah/1/");
  await page.getByRole("button", { name: "Open reading settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Reading settings" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("no horizontal overflow at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/surah/2/", "/search/", "/bookmarks/", "/settings/"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} should not overflow`).toBeLessThanOrEqual(0);
  }
});
