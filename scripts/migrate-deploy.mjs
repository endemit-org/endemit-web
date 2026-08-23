/**
 * Runs `prisma migrate deploy` reliably on Neon:
 *
 * 1. Rewrites DATABASE_URL to the DIRECT (non-pooled) host by stripping the
 *    `-pooler` suffix. Advisory locks (which migrate uses) are unreliable
 *    through PgBouncer transaction pooling — each statement can land on a
 *    different backend, so pg_advisory_lock times out (P1002).
 * 2. Retries a few times with backoff for the legitimate case: a concurrent
 *    build still holding the lock.
 *
 * The app itself keeps using the pooled DATABASE_URL — only this migrate
 * step talks to the direct endpoint.
 */
import { spawnSync } from "node:child_process";

const RETRIES = 3;
const BACKOFF_SECONDS = [15, 30, 60];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate-deploy] DATABASE_URL is not set");
  process.exit(1);
}

let directUrl = url;
try {
  const parsed = new URL(url);
  if (parsed.hostname.includes("-pooler")) {
    parsed.hostname = parsed.hostname.replace("-pooler", "");
    directUrl = parsed.toString();
    console.log(`[migrate-deploy] using direct (non-pooled) host: ${parsed.hostname}`);
  }
} catch {
  console.warn("[migrate-deploy] could not parse DATABASE_URL, using it as-is");
}

for (let attempt = 1; attempt <= RETRIES; attempt++) {
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: directUrl },
  });

  if (result.status === 0) {
    process.exit(0);
  }

  if (attempt < RETRIES) {
    const wait = BACKOFF_SECONDS[attempt - 1];
    console.warn(
      `[migrate-deploy] attempt ${attempt}/${RETRIES} failed (likely advisory-lock contention), retrying in ${wait}s…`
    );
    spawnSync("sleep", [String(wait)]);
  } else {
    console.error(`[migrate-deploy] failed after ${RETRIES} attempts`);
    process.exit(result.status ?? 1);
  }
}
