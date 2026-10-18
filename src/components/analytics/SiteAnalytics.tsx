"use client";

import { Analytics } from "@vercel/analytics/next";
import { redactAnalyticsUrl } from "@/lib/analytics";

/**
 * Cookieless page counting. This wrapper exists for one reason: to strip the
 * query string and fragment from every reported page view, so a search such as
 * `/search/?q=…` reaches Vercel as `/search/` and nothing else. Dropping the
 * event entirely is the wrong trade — an unmeasured copy of a teacher's page is
 * not more private than a measured one with the words removed.
 *
 * It reports nothing at all when the site is not hosted on Vercel, because the
 * script it loads is served from that host.
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => ({
        ...event,
        url: redactAnalyticsUrl(event.url),
      })}
    />
  );
}
