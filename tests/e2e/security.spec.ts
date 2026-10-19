import { expect, test } from "@playwright/test";

type CspProbe = { __cspViolations?: string[] };

test("the app runs under its Content-Security-Policy without violations", async ({ page }) => {
  await page.addInitScript(() => {
    const probe = window as unknown as CspProbe;
    probe.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      probe.__cspViolations?.push(`${event.violatedDirective} :: ${event.blockedURI}`);
    });
  });

  const response = await page.goto("/surah/2/");
  const headers = response?.headers() ?? {};
  test.skip(
    !headers["content-security-policy"],
    "this server does not send a Content-Security-Policy (the dev server does not)",
  );

  // The rest of the policy travels with the page: a static host disables the
  // sniffing and framing paths too.
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  // The analytics client asks for its bundle on this origin in production,
  // which is what keeps it inside the policy's `'self'` allowance.
  await expect(page.locator('script[src$="/_vercel/insights/script.js"]')).toHaveAttribute(
    "src",
    "/_vercel/insights/script.js",
  );

  // Exercise everything the reader loads: the inline theme bootstrap, the
  // Tajweed markup, the settings sheet, the search index and its fetch.
  const tajweed = page.getByRole("button", { name: "Tajweed highlighting" });
  await expect(page.locator(".tajweed-mark").first()).toBeVisible();
  await tajweed.click();
  await expect(page.locator(".tajweed-mark")).toHaveCount(0);
  await tajweed.click();
  await expect(page.locator(".tajweed-mark").first()).toBeVisible();
  await page.getByRole("button", { name: "Open reading settings" }).click();
  await page.keyboard.press("Escape");

  // Land with the query already in the URL so the index fetch starts on mount
  // instead of depending on a fill event that may arrive before hydration.
  await page.goto("/search/?q=mercy");
  await expect(page.locator("main li").first()).toBeVisible();

  const appViolations = await page.evaluate(
    () => (window as unknown as CspProbe).__cspViolations ?? [],
  );
  expect(appViolations).toEqual([]);
});

test("the policy actually blocks a script from another origin", async ({ page }) => {
  await page.addInitScript(() => {
    const probe = window as unknown as CspProbe;
    probe.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      probe.__cspViolations?.push(`${event.violatedDirective} :: ${event.blockedURI}`);
    });
  });

  const response = await page.goto("/");
  const csp = response?.headers()["content-security-policy"];
  test.skip(!csp, "this server does not send a Content-Security-Policy");

  await page.evaluate(() => {
    const script = document.createElement("script");
    script.src = "https://example.com/not-allowed.js";
    document.head.appendChild(script);
  });
  await page.waitForTimeout(400);

  const violations = await page.evaluate(
    () => (window as unknown as CspProbe).__cspViolations ?? [],
  );
  expect(violations.some((entry) => entry.startsWith("script-src"))).toBe(true);
});
