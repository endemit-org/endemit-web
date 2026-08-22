import "dotenv/config";
import { readFileSync, readdirSync, existsSync } from "node:fs";

/**
 * Push local slice models (src/app/_prismic-slices/X/model.json) and custom
 * types (customtypes/X/index.json) to Prismic's Custom Types API — replaces
 * the interactive SliceMachine push step.
 *
 * Usage:
 *   npx tsx scripts/prismic-push-types.ts                # push everything (idempotent)
 *   npx tsx scripts/prismic-push-types.ts slice:vfx type:event
 */

const REPO = process.env.PRISMIC_REPOSITORY_NAME;
const TOKEN = process.env.PRISMIC_CUSTOM_TYPES_TOKEN;
const API = "https://customtypes.prismic.io";

if (!REPO || !TOKEN) {
  console.error("Missing PRISMIC_REPOSITORY_NAME or PRISMIC_CUSTOM_TYPES_TOKEN");
  process.exit(1);
}

const headers = {
  repository: REPO,
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function existingIds(kind: "customtypes" | "slices"): Promise<Set<string>> {
  const res = await fetch(`${API}/${kind}`, { headers });
  if (!res.ok) throw new Error(`GET /${kind} failed: ${res.status} ${await res.text()}`);
  const list = (await res.json()) as Array<{ id: string }>;
  return new Set(list.map(item => item.id));
}

async function push(kind: "customtypes" | "slices", body: { id: string }, exists: boolean) {
  const action = exists ? "update" : "insert";
  const res = await fetch(`${API}/${kind}/${action}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  // 204 = ok; treat "already exists" races as success via update retry
  if (!res.ok) {
    throw new Error(`${action} ${kind}/${body.id} failed: ${res.status} ${await res.text()}`);
  }
  console.log(`${exists ? "updated" : "inserted"} ${kind === "slices" ? "slice" : "type"}: ${body.id}`);
}

function localSlices(): Array<{ id: string; body: { id: string } }> {
  const out = [];
  for (const dir of readdirSync("src/app/_prismic-slices")) {
    const path = `src/app/_prismic-slices/${dir}/model.json`;
    if (!existsSync(path)) continue;
    const body = JSON.parse(readFileSync(path, "utf8"));
    out.push({ id: body.id as string, body });
  }
  return out;
}

function localTypes(): Array<{ id: string; body: { id: string } }> {
  const out = [];
  for (const dir of readdirSync("customtypes")) {
    const path = `customtypes/${dir}/index.json`;
    if (!existsSync(path)) continue;
    const body = JSON.parse(readFileSync(path, "utf8"));
    out.push({ id: body.id as string, body });
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const wantedSlices = args.filter(a => a.startsWith("slice:")).map(a => a.slice(6));
  const wantedTypes = args.filter(a => a.startsWith("type:")).map(a => a.slice(5));
  const pushAll = args.length === 0;

  const [sliceIds, typeIds] = await Promise.all([
    existingIds("slices"),
    existingIds("customtypes"),
  ]);

  for (const { id, body } of localSlices()) {
    if (pushAll || wantedSlices.includes(id)) {
      await push("slices", body, sliceIds.has(id));
    }
  }
  for (const { id, body } of localTypes()) {
    if (pushAll || wantedTypes.includes(id)) {
      await push("customtypes", body, typeIds.has(id));
    }
  }
  console.log("done");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
