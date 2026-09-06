import { execSync } from "node:child_process";
import { DATABASE_URL } from "../playwright.config";

/**
 * Runs once before the browser tests: apply the Prisma schema to the throwaway
 * e2e database. The webServers (started by Playwright afterwards) then boot
 * against a migrated, empty database.
 */
export default function globalSetup() {
  console.log(`[e2e] migrating ${DATABASE_URL.replace(/:[^:@/]+@/, ":***@")}`);
  execSync("npx prisma migrate deploy", {
    cwd: "apps/backend",
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL },
  });
}
