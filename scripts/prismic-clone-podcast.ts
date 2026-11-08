import "dotenv/config";
import * as prismic from "@prismicio/client";
import { readFileSync } from "fs";
import { createClient } from "./prismic-lib";

/**
 * Creates a new podcast episode document (as an unpublished planned version)
 * by copying the structural fields of an existing episode and swapping in the
 * next episode number, date, artist and tracklist. Images and descriptions are
 * left empty for the editor to fill in Prismic.
 *
 *   PRISMIC_WRITE_TOKEN=... npx tsx scripts/prismic-clone-podcast.ts \
 *     --from emit-015-rahul --number 016 --date 2026-11-07 \
 *     --artist "TBA" --tracklist ./tracklist.txt [--uid emit-016] [--published]
 *
 * Tracklist file: one "Artist - Title" per line, blank lines ignored.
 */

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1]) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing --${name}`);
  }
  return process.argv[i + 1];
}

const fromUid = arg("from");
const number = arg("number");
const date = arg("date");
const artistName = arg("artist", "TBA");
const tracklistPath = arg("tracklist");
const uid = arg("uid", `emit-${number}`);
const published = process.argv.includes("--published");

const tracklist = readFileSync(tracklistPath, "utf8")
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean)
  .map(line => {
    const idx = line.indexOf(" - ");
    if (idx === -1) throw new Error(`Cannot split "${line}" on " - "`);
    return {
      artist: line.slice(0, idx).trim(),
      title: line.slice(idx + 3).trim(),
      link: { link_type: "Any" },
      timestamp: "",
    };
  });

const longDate = new Date(date).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const footnote = `Endemit · Emit ${number} · ${artistName} · ${longDate.replace(",", "")}`;

async function main() {
  const client = createClient();
  const source = await client.getByUID("podcast" as never, fromUid);
  const src = source.data as Record<string, unknown>;

  const episodeName = `Emit ${number} - ${artistName}`;
  const data = {
    episode_name: episodeName,
    episode_number: number,
    episode_description: [],
    episode_description_sl: [],
    footnote,
    tracklist,
    track_url: `https://soundcloud.com/ende-mit/emit-${number}`,
    published,
    episode_date: date,
    slices: [],
  };

  console.log(`Cloning ${fromUid} (${src.episode_name}) -> ${uid}`);
  console.log(
    `  ${episodeName} | ${date} | ${tracklist.length} tracks | published=${published}`
  );
  console.log(`  footnote: ${footnote}`);

  const migration = prismic.createMigration();
  migration.createDocument(
    { type: "podcast", uid, lang: source.lang, data } as never,
    episodeName
  );
  await client.migrate(migration, { reporter: () => {} });
  console.log(`  ✓ created podcast/${uid} (planned version, unpublished)`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
