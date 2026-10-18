// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => ({
  props: undefined as undefined | Record<string, unknown>,
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: (props: Record<string, unknown>) => {
    captured.props = props;
    return null;
  },
}));

import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
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

describe("the analytics element the app renders", () => {
  it("hands the analytics client a beforeSend that redacts the page address", () => {
    render(<SiteAnalytics />);

    const beforeSend = captured.props?.beforeSend;
    expect(beforeSend).toBeTypeOf("function");

    const event = { type: "pageview", url: "https://mushafly.com/search/?q=mercy" };
    const sent = (beforeSend as (value: typeof event) => typeof event | null)(event);

    expect(sent?.url).toBe("https://mushafly.com/search/");
    expect(sent?.type).toBe("pageview");
  });
});
