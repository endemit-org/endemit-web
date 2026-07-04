import "dotenv/config";
import * as prismic from "@prismicio/client";
import { createClient, migrateSingle } from "./prismic-lib";

/**
 * Localizes the singleton documents: home_page (slices), footer_content
 * (footer_text + language-specific links_sl) and menu_navigation (per-item
 * link_sl + cta_text_sl). Drafts land in the planned version.
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-migrate-singletons.ts
 */

type WebLink = { link_type: "Web"; url: string; text: string; variant?: string };

async function migrateFooter() {
  const client = createClient();
  const doc = await client.getSingle("footer_content");
  const data = doc.data as Record<string, unknown>;
  const base = (data.links as WebLink[]) ?? [];
  // language-specific link twins: same URLs, Slovenian display text
  const slText: Record<string, string> = {
    "/terms-and-conditions": "Splošni pogoji",
    "/privacy-policy": "Politika zasebnosti",
    "/right-to-withdrawal": "Pravica do odstopa",
    "/venues": "Prizorišča",
  };
  data.links_sl = base.map(l => ({
    ...l,
    text: slText[l.url] ?? l.text,
  }));
  const migration = prismic.createMigration();
  migration.updateDocument(doc as never, "Footer content");
  await client.migrate(migration, { reporter: () => {} });
  console.log("  ✓ footer_content (single)");
}

async function migrateNav() {
  const client = createClient();
  const doc = await client.getSingle("menu_navigation");
  const data = doc.data as Record<string, unknown>;
  const items = (data.items as Record<string, unknown>[]) ?? [];
  // Slovenian labels keyed by the link url (event name "Endemit '26" stays).
  const labelSl: Record<string, string> = {
    "/": "Domov",
    "/events": "Dogodki",
    "/music": "Glasba",
    "/store": "Podpri nas",
    "/artists": "Umetniki",
    "/about": "O nas",
  };
  for (const item of items) {
    const link = item.link as WebLink | undefined;
    if (link?.url && labelSl[link.url]) {
      item.link_sl = { ...link, text: labelSl[link.url] };
    }
    if (item.cta_text) item.cta_text_sl = item.cta_text; // "Festival" is the same
  }
  const migration = prismic.createMigration();
  migration.updateDocument(doc as never, "Menu navigation");
  await client.migrate(migration, { reporter: () => {} });
  console.log("  ✓ menu_navigation (single)");
}

async function main() {
  console.log("Singletons:");
  await migrateSingle({
    type: "home_page",
    internalName: "Home page",
    slices: {
      0: {
        primary: {
          heading: "Zadnja runda kart",
          description: "Festival 2026  ·  14.–16. avgust  ·  Libeliče",
        },
      },
      2: { primary: { title: "Prihajajoči dogodki" } },
      4: {
        primary: {
          title: "Zasedba festivala '26",
          description:
            "14 umetnikov. Seti, ob katerih zastane dih. Megla. Noč. Plesišče te čaka.",
        },
      },
      // slice 6 hero heading "Seiichiro Itoyama" is an artist name -> universal
      6: { primary: { description: "emit 012 · Zadnja epizoda" } },
      // slice 10 collab_promo title "Hands of the Creator" -> brand, universal
      10: {
        primary: {
          description:
            "Naša kolaboracija s HOTC ob Rhaegalovem novem albumu Darkest And Oddest Shades. LP je razprodan, digitalni album pa majce so še na volo.",
        },
      },
    },
  });
  await migrateFooter();
  await migrateNav();
  console.log("\nSingletons done.");
}

main().catch(err => {
  console.error("Singletons migration failed:", err?.message || err);
  if (err?.response?.details) console.error(JSON.stringify(err.response.details));
  process.exit(1);
});
