import { defineConfig, devices } from "@playwright/test";

const port = 5174;

// End-to-end tests in a real browser against the Vite dev server. The tests stub /api/* with
// page.route, so the Go API doesn't need to run.
export default defineConfig({
  testDir: "e2e",
  forbidOnly: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
  },
});
