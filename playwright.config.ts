import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests: a real Chromium browser driving the built frontend against
 * the real NestJS API and a throwaway Postgres (see docker-compose.yml).
 *
 * Local run:  npm run e2e         (starts the DB, builds, runs)
 * CI:         a dedicated job with a postgres service — see .github/workflows/ci.yml
 */

const API_PORT = 4000;
const WEB_PORT = 3000;

// The e2e database. docker-compose.yml maps the container to :5433 locally; CI
// sets E2E_DATABASE_URL to its postgres service.
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://rolio:rolio@localhost:5433/rolio_e2e";

const JWT_SECRET = "e2e-only-secret-not-for-production";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "npm run start:prod -w backend",
      url: `http://localhost:${API_PORT}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: "pipe",
      env: {
        DATABASE_URL,
        JWT_SECRET,
        FRONTEND_URL: `http://localhost:${WEB_PORT}`,
        PORT: String(API_PORT),
      },
    },
    {
      command: `npm run start -w frontend -- -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
});

export { DATABASE_URL };
