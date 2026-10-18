/**
 * Analytics sees the address of the page being viewed. In this app that
 * address can carry the reader's own words: a search lands on
 * `/search/?q=…`. Query strings and fragments are therefore stripped before an
 * event leaves the browser, so no reader-authored value is ever reported.
 */
export function redactAnalyticsUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    // Not a parseable URL: report the app's own path rather than the raw value.
    return "/";
  }
}
