import "dotenv/config";
import * as prismic from "@prismicio/client";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Reusable helpers for filling Slovenian (_sl) fields on Prismic documents via
 * the Migration API. Auto-detects each field's type + allowed RichText block
 * types from the local models so callers just pass plain strings.
 */

type FieldConfig = { type: string; config?: Record<string, unknown> };

// ---- model lookups -------------------------------------------------------
const customTypeCache: Record<string, Record<string, FieldConfig>> = {};
function customTypeFields(type: string): Record<string, FieldConfig> {
  if (customTypeCache[type]) return customTypeCache[type];
  const d = JSON.parse(readFileSync(`customtypes/${type}/index.json`, "utf8"));
  const flat: Record<string, FieldConfig> = {};
  for (const tab of Object.values(d.json as Record<string, Record<string, FieldConfig>>)) {
    for (const [name, cfg] of Object.entries(tab)) flat[name] = cfg;
  }
  customTypeCache[type] = flat;
  return flat;
}

function groupFields(type: string, group: string): Record<string, FieldConfig> {
  const g = customTypeFields(type)[group];
  return ((g?.config as { fields?: Record<string, FieldConfig> })?.fields) ?? {};
}

const sliceCache: Record<string, { primary: Record<string, FieldConfig>; items: Record<string, FieldConfig> }> = {};
function sliceFields(sliceType: string) {
  if (sliceCache[sliceType]) return sliceCache[sliceType];
  for (const dir of readdirSync("src/app/_prismic-slices")) {
    const path = `src/app/_prismic-slices/${dir}/model.json`;
    let d: { id: string; variations: { primary?: Record<string, FieldConfig>; items?: Record<string, FieldConfig> }[] };
    try {
      d = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      continue;
    }
    if (d.id === sliceType) {
      const primary: Record<string, FieldConfig> = {};
      const items: Record<string, FieldConfig> = {};
      for (const v of d.variations) {
        Object.assign(primary, v.primary ?? {});
        Object.assign(items, v.items ?? {});
      }
      sliceCache[sliceType] = { primary, items };
      return sliceCache[sliceType];
    }
  }
  return { primary: {}, items: {} };
}

// ---- formatting ----------------------------------------------------------
function formatField(cfg: FieldConfig | undefined, text: string): unknown {
  if (!cfg) return text;
  if (cfg.type !== "StructuredText") return text; // KeyText etc. -> string
  const c = (cfg.config ?? {}) as { single?: string; multi?: string };
  const allowed = c.single ? [c.single] : (c.multi ?? "paragraph").split(",");
  if (allowed.includes("paragraph")) {
    return text.split("\n").map(t => ({ type: "paragraph", text: t, spans: [] }));
  }
  // single non-paragraph block (e.g. heading1)
  return [{ type: allowed[0], text, spans: [] }];
}

// ---- public API ----------------------------------------------------------
export type DocTranslations = {
  type: string;
  internalName: string;
  base?: Record<string, string>; // top-level field name -> sl text
  bios?: Record<string, string>; // artist uid -> description_override_sl text
  slices?: Record<number, { primary?: Record<string, string>; items?: Record<string, string>[] }>;
};

export function createClient() {
  return prismic.createWriteClient(process.env.PRISMIC_REPOSITORY_NAME || "endemit", {
    writeToken: process.env.PRISMIC_WRITE_TOKEN!,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });
}

export async function migrateDoc(uid: string, t: DocTranslations) {
  const client = createClient();
  const doc = await client.getByUID(t.type as never, uid);
  const data = doc.data as Record<string, unknown>;
  const ctFields = customTypeFields(t.type);

  // base fields
  for (const [name, text] of Object.entries(t.base ?? {})) {
    data[`${name}_sl`] = formatField(ctFields[name], text);
  }

  // artist bios (event.artists group's description_override), matched by uid
  if (t.bios) {
    const gf = groupFields(t.type, "artists");
    const artists = (data.artists as Record<string, unknown>[]) ?? [];
    let n = 0;
    for (const a of artists) {
      const uidRef = (a.artist as { uid?: string } | undefined)?.uid;
      const text = uidRef ? t.bios[uidRef] : undefined;
      if (text) {
        a.description_override_sl = formatField(gf.description_override, text);
        n++;
      }
    }
    console.log(`  bios filled: ${n}/${Object.keys(t.bios).length}`);
  }

  // slices
  const slices = (data.slices as Record<string, unknown>[]) ?? [];
  for (const [idxStr, ov] of Object.entries(t.slices ?? {})) {
    const s = slices[Number(idxStr)];
    if (!s) continue;
    const { primary, items } = sliceFields(s.slice_type as string);
    if (ov.primary) {
      const p = (s.primary as Record<string, unknown>) ?? {};
      for (const [name, text] of Object.entries(ov.primary)) {
        p[`${name}_sl`] = formatField(primary[name], text);
      }
      s.primary = p;
    }
    if (ov.items) {
      const arr = (s.items as Record<string, unknown>[]) ?? [];
      ov.items.forEach((row, j) => {
        if (!arr[j]) return;
        for (const [name, text] of Object.entries(row)) {
          arr[j][`${name}_sl`] = formatField(items[name], text);
        }
      });
    }
  }

  const migration = prismic.createMigration();
  migration.updateDocument(doc as never, t.internalName);
  await client.migrate(migration, { reporter: () => {} });
  console.log(`  ✓ migrated ${t.type}/${uid} (planned version)`);
}
