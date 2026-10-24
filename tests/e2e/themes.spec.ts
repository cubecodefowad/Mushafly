import { expect, test } from "@playwright/test";

const DESIGNS = ["madinah", "andalus", "ottoman"] as const;

test.describe("mushaf borders", () => {
  for (const design of DESIGNS) {
    test(`${design} frames the reading page`, async ({ page }) => {
      await page.addInitScript((id) => {
        localStorage.setItem("mushafly.settings.v1", JSON.stringify({ mushaf: id }));
      }, design);
      await page.goto("/surah/2/");

      await expect(page.locator("html")).toHaveAttribute("data-mushaf", design);
      const frame = page.locator(".mushaf-frame");
      await expect(frame).toHaveCount(1);

      // The frame wraps the text, not the toolbar or the side panel.
      await expect(frame.locator("#verse-1")).toHaveCount(1);
      await expect(frame.locator("#verse-7")).toHaveCount(1);
      await expect(page.locator(".mushaf-frame .mushaf-ornament[aria-hidden='true']")).toHaveCount(
        6,
      );
    });
  }

  test("a design changes the paper, and plain restores the unframed page", async ({ page }) => {
    // Seed once: init scripts run on every navigation, and re-seeding would
    // undo the choice this test makes in settings.
    await page.addInitScript(() => {
      if (!localStorage.getItem("mushafly.settings.v1")) {
        localStorage.setItem("mushafly.settings.v1", JSON.stringify({ mushaf: "madinah" }));
      }
    });
    await page.goto("/surah/1/");
    const paper = await page.evaluate(
      () => getComputedStyle(document.documentElement).getPropertyValue("--background").trim(),
    );
    expect(paper).toBe("#f6f4e8");

    await page.goto("/settings/");
    const picker = page.getByRole("group", { name: "Mushaf border" });
    // The stored design is applied only after hydration; wait for it before
    // clicking so the picker's handler is live.
    await expect(picker.getByRole("button", { name: /Madinah/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await picker.getByRole("button", { name: /Plain/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mushaf", "plain");
    await page.goto("/surah/1/");

    // The wrapper is always in the markup; plain simply draws nothing.
    const frame = page.locator(".mushaf-frame");
    await expect(frame).toHaveCount(1);
    const drawn = await frame.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        border: style.borderTopWidth,
        padding: style.paddingTop,
        margin: style.marginTop,
        ornament: getComputedStyle(element.querySelector(".mushaf-ornament")!).display,
      };
    });
    expect(drawn).toEqual({ border: "0px", padding: "0px", margin: "0px", ornament: "none" });
  });

  test("the settings picker applies and keeps the chosen design", async ({ page }) => {
    await page.goto("/settings/");
    await expect(page.locator("html")).toHaveAttribute("data-mushaf", "plain");

    const picker = page.getByRole("group", { name: "Mushaf border" });
    await expect(picker.getByRole("button", { name: /Plain/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await picker.getByRole("button", { name: /Ottoman/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mushaf", "ottoman");
    await expect(picker.getByRole("button", { name: /Ottoman/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem("mushafly.settings.v1");
      return raw ? JSON.parse(raw).mushaf : null;
    });
    expect(stored).toBe("ottoman");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-mushaf", "ottoman");
    await page.goto("/surah/112/");
    await expect(page.locator(".mushaf-frame")).toHaveCount(1);
  });

  test("the reading sheet offers the same designs", async ({ page }) => {
    await page.goto("/surah/1/");
    await page.getByRole("button", { name: "Open reading settings" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const picker = dialog.getByRole("group", { name: "Mushaf border" });
    await picker.getByRole("button", { name: /Andalus/ }).click();

    await expect(page.locator("html")).toHaveAttribute("data-mushaf", "andalus");
    await expect(page.locator(".mushaf-frame")).toHaveCount(1);
  });
});
