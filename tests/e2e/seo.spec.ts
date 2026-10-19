import { expect, test, type Page } from "@playwright/test";

const ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://mushafly.com").origin;
  } catch {
    return "https://mushafly.com";
  }
})();

const meta = (page: Page, attribute: string, value: string) =>
  page.locator(`meta[${attribute}="${value}"]`).getAttribute("content");

test("home declares canonical, Open Graph and Twitter metadata", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${ORIGIN}/`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${ORIGIN}/`,
  );
  expect(await meta(page, "property", "og:site_name")).toBe("Mushafly");
  expect(await meta(page, "property", "og:title")).toContain("Mushafly");
  expect(await meta(page, "property", "og:description")).toContain("Quran");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${ORIGIN}/og.png`,
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    "content",
    "1200",
  );
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
    "content",
    "630",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    `${ORIGIN}/twitter.png`,
  );
});

test("the social card is a real PNG at the advertised path", async ({ request }) => {
  const response = await request.get("/og.png");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  const bytes = await response.body();
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
});

test("a surah page gets its own canonical and card instead of the home page's", async ({
  page,
}) => {
  await page.goto("/surah/2/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${ORIGIN}/surah/2/`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${ORIGIN}/surah/2/`,
  );
  expect(await meta(page, "property", "og:title")).toContain("Al-Baqara");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${ORIGIN}/og.png`,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    `${ORIGIN}/twitter.png`,
  );
});

test("structured data describes the site and its search action", async ({ page }) => {
  await page.goto("/");
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(raw).toBeTruthy();
  const schema = JSON.parse(raw ?? "{}") as {
    "@type"?: string;
    url?: string;
    potentialAction?: { target?: { urlTemplate?: string } };
  };
  expect(schema["@type"]).toBe("WebSite");
  expect(schema.url).toBe(ORIGIN);
  expect(schema.potentialAction?.target?.urlTemplate).toBe(
    `${ORIGIN}/search/?q={search_term_string}`,
  );
});

test("robots.txt and the sitemap point crawlers at every public page", async ({
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  const rules = await robots.text();
  expect(rules).toContain("Allow: /");
  expect(rules).toContain("Disallow: /bookmarks/");
  expect(rules).toContain("Disallow: /settings/");
  expect(rules).toContain("Disallow: /social-preview/");
  expect(rules).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toContain("xml");
  const xml = await sitemap.text();
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(locations).toHaveLength(121);
  expect(locations[0]).toBe(`${ORIGIN}/`);
  expect(locations).toContain(`${ORIGIN}/surah/1/`);
  expect(locations).toContain(`${ORIGIN}/surah/114/`);
  expect(locations).toContain(`${ORIGIN}/tajweed/`);
  expect(locations).not.toContain(`${ORIGIN}/bookmarks/`);
  expect(locations).not.toContain(`${ORIGIN}/settings/`);
  expect(xml).not.toContain("?q=");
});

test("the 404 page returns a real 404 and is marked noindex", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page is not in the Book." })).toBeVisible();
  await expect(page).toHaveTitle("Page not found · Mushafly");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("the social preview page shows the generated card and is noindex", async ({
  page,
}) => {
  await page.goto("/social-preview/");
  await expect(page).toHaveTitle("Social preview · Mushafly");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("img", { name: "Mushafly social card" })).toHaveAttribute(
    "src",
    "/og.png",
  );
  const image = page.getByRole("img", { name: "Mushafly social card" });
  await expect(image).toHaveJSProperty("naturalWidth", 1200);
  await expect(image).toHaveJSProperty("naturalHeight", 630);
});
