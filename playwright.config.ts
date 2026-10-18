import { defineConfig, devices } from "@playwright/test";

// BASE_URL targets an already-running server (for example the static export
// served by `npm run start`) instead of starting a development server.
const baseURL = process.env.BASE_URL ?? "http://localhost:50517";
const useStaticExport = Boolean(process.env.BASE_URL);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: useStaticExport
    ? undefined
    : {
        command: "npm run dev -- --port 50517",
        url: "http://localhost:50517",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
