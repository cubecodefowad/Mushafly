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

test("about page carries the disclaimer and a reachable contact section", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { level: 1, name: "About Mushafly" })).toBeVisible();

  const main = page.locator("main");
  await expect(main).toContainText(DISCLAIMER_OPENING);
  await expect(main).toContainText(DISCLAIMER_CLOSING);

  await expect(page.locator("#contact")).toBeVisible();
  await expect(
    main.getByRole("link", { name: "semarketir/quranjson" }),
  ).toBeVisible();
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

  await page.getByRole("contentinfo").getByRole("link", { name: "Accuracy and Sources" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Accuracy and Sources" })).toBeVisible();
});
