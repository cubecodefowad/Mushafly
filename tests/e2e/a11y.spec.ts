import path from "node:path";
import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", name: "home" },
  { path: "/surah/2/", name: "surah reader" },
  { path: "/search/", name: "search" },
  { path: "/bookmarks/", name: "bookmarks" },
  { path: "/settings/", name: "settings" },
  { path: "/terms/", name: "terms" },
  { path: "/privacy/", name: "privacy" },
  { path: "/accuracy/", name: "accuracy and sources" },
  { path: "/about/", name: "about" },
  { path: "/tajweed/", name: "tajweed and marks" },
];

for (const target of pages) {
  test(`axe: ${target.name}`, async ({ page }) => {
    await page.goto(target.path);
    await page.waitForLoadState("networkidle");
    await page.addScriptTag({
      path: path.resolve("node_modules/axe-core/axe.min.js"),
    });
    const violations = await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axe = (window as any).axe;
      const results = await axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
      return results.violations.map(
        (violation: {
          id: string;
          impact: string;
          help: string;
          nodes: Array<{ target: string[]; failureSummary: string }>;
        }) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          nodes: violation.nodes.slice(0, 4).map((node) => ({
            target: node.target.join(" "),
            failureSummary: node.failureSummary,
          })),
        }),
      );
    });

    const serious = violations.filter(
      (violation: { impact: string }) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test("axe: dark surah reader", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushafly.settings.v1", JSON.stringify({ theme: "dark" }));
  });
  await page.goto("/surah/2/");
  await page.waitForLoadState("networkidle");
  await page.addScriptTag({
    path: path.resolve("node_modules/axe-core/axe.min.js"),
  });
  const violations = await page.evaluate(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axe = (window as any).axe;
    const results = await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
    });
    return results.violations
      .filter((violation: { impact: string }) =>
        ["serious", "critical"].includes(violation.impact),
      )
      .map((violation: { id: string; help: string }) => ({ id: violation.id, help: violation.help }));
  });
  expect(violations).toEqual([]);
});
