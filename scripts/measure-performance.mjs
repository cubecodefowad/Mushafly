/**
 * Measures LCP and CLS against the built static preview.
 * Start `npm run preview` first, then `npm run perf`.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const ROUTES = ["/", "/surah/2/", "/search/", "/settings/"];

const INIT = () => {
  window.__mushaflyPerf = { lcp: 0, cls: 0 };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__mushaflyPerf.lcp = Math.max(window.__mushaflyPerf.lcp, entry.startTime);
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) window.__mushaflyPerf.cls += entry.value;
    }
  }).observe({ type: "layout-shift", buffered: true });
};

const browser = await chromium.launch();

async function measure(label, contextOptions, throttle) {
  console.log(`\n${label}`);
  for (const route of ROUTES) {
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    if (throttle) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: throttle.latency,
        downloadThroughput: throttle.download,
        uploadThroughput: throttle.upload,
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle.cpu });
    }
    await page.addInitScript(INIT);
    const started = Date.now();
    await page.goto(`${BASE}${route}`, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    const result = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      return {
        lcp: Math.round(window.__mushaflyPerf.lcp),
        cls: Number(window.__mushaflyPerf.cls.toFixed(4)),
        ttfb: Math.round(nav?.responseStart ?? 0),
        fcp: Math.round(
          performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0,
        ),
        resources: resources.length,
        transferred: Math.round(
          resources.reduce((sum, entry) => sum + (entry.transferSize ?? 0), 0) / 1024,
        ),
      };
    });
    console.log(
      `${route.padEnd(14)} LCP ${String(result.lcp).padStart(5)}ms  ` +
        `CLS ${String(result.cls).padEnd(6)} FCP ${String(result.fcp).padStart(5)}ms  ` +
        `TTFB ${String(result.ttfb).padStart(4)}ms  ` +
        `${result.resources} req / ${result.transferred} KiB  wall ${Date.now() - started}ms`,
    );
    await context.close();
  }
}

await measure("Desktop 1440×900", { viewport: { width: 1440, height: 900 } });
await measure(
  "Mobile 390×844 · Fast 3G · 4× CPU",
  { viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 },
  { latency: 150, download: (1.6 * 1024 * 1024) / 8, upload: (750 * 1024) / 8, cpu: 4 },
);

await browser.close();
