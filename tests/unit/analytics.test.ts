import { describe, expect, it } from "vitest";
import { redactAnalyticsUrl } from "@/lib/analytics";

describe("analytics redaction", () => {
  it("strips the search term a reader typed", () => {
    expect(redactAnalyticsUrl("https://mushafly.com/search/?q=mercy")).toBe(
      "https://mushafly.com/search/",
    );
    expect(redactAnalyticsUrl("https://mushafly.com/search/?q=%D8%B1%D8%AD%D9%85%D8%A9")).toBe(
      "https://mushafly.com/search/",
    );
  });

  it("strips fragments and every other query parameter", () => {
    expect(redactAnalyticsUrl("https://mushafly.com/surah/2/?utm_source=x#verse-255")).toBe(
      "https://mushafly.com/surah/2/",
    );
    expect(redactAnalyticsUrl("https://mushafly.com/?a=1&b=2")).toBe("https://mushafly.com/");
  });

  it("leaves a plain page address intact", () => {
    expect(redactAnalyticsUrl("https://mushafly.com/surah/7/")).toBe("https://mushafly.com/surah/7/");
  });

  it("falls back to the site root for anything unparseable", () => {
    expect(redactAnalyticsUrl("not a url")).toBe("/");
    expect(redactAnalyticsUrl("")).toBe("/");
  });
});
