/**
 * Builds the optimized festival 2027 assets from the raw (gitignored) source
 * folders into public/images/festival/2027. Originals stay untouched.
 *
 *   node scripts/prepare-festival-2027.mjs            # everything
 *   node scripts/prepare-festival-2027.mjs layers     # only one group
 *
 * Groups: layers, photos, video. Needs ffmpeg on PATH for the video group.
 */
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, statSync } from "node:fs";

const LAYERS = "festival-vib-graphics/layered graphic";
const PHOTOS = "festival-content-temp";
const FILM = "festival-content-vids/Endemit N&D.mp4";
const OUT = "public/images/festival/2027";
const only = process.argv[2];
const run = group => !only || only === group;
mkdirSync(`${OUT}/motion`, { recursive: true });

const kb = file => Math.round(statSync(file).size / 1024);
const open = file => sharp(file, { limitInputPixels: false });
const manifest = { layers: {}, creatures: [], photos: [], loops: [] };

// ---- illustrated layers ----------------------------------------------------
// Each layer is trimmed to its painted area so it can be placed and moved
// independently. `widths` are the exported pixel widths (largest first).
const layerSpecs = [
  // name, file, widths, quality, crop (optional, source pixels)
  // The stippled sky is costly to encode: AVIF with a small WebP fallback.
  ["sky", "vesolje.png", [1400, 800], 34, { left: 0, top: 0, width: 5540, height: 4960 }, "avif"],
  ["stars", "zvezde.png", [1600, 900], 78],
  ["hill-far", "hrib1.png", [1600, 900], 72],
  ["hill-mid", "hrib2.png", [1600, 900], 72],
  ["hill-near", "hrib3.png", [1600, 900], 72],
  ["forest", "gozd.png", [1600, 900], 70],
  ["dome", "dome.png", [720, 420], 82],
  ["tree-a", "drevo1.png", [760, 440], 80],
  ["tree-b", "drevo2.png", [720, 420], 80],
  ["tree-c", "drevo3.png", [520, 320], 80],
];

// Creature sprite sheet (endemitki.png, 3508x2480): one box per creature.
const creatureBoxes = [
  [600, 300, 990, 780],
  [2210, 330, 990, 730],
  [1710, 830, 530, 520],
  [310, 1360, 920, 760],
  [1550, 1510, 900, 650],
  [2680, 1570, 650, 580],
];

async function buildLayers() {
  for (const [name, file, widths, quality, crop, format = "webp"] of layerSpecs) {
    let base = open(`${LAYERS}/${file}`);
    if (crop) base = base.extract(crop);
    const trimmed = await base
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
      .png({ compressionLevel: 1 })
      .toBuffer({ resolveWithObject: true });
    const ratio = trimmed.info.height / trimmed.info.width;
    const sizes = [];
    for (const width of widths) {
      const target = `${OUT}/${name}-${width}.${format}`;
      const resized = sharp(trimmed.data, { limitInputPixels: false }).resize({ width });
      await (format === "avif"
        ? resized.avif({ quality, effort: 6 })
        : resized.webp({ quality, alphaQuality: 80, effort: 6 })
      ).toFile(target);
      sizes.push(width);
      console.log(`layer ${name}-${width}.${format} ${kb(target)}K`);
    }
    if (format === "avif") {
      const fallback = `${OUT}/${name}-fallback.webp`;
      await sharp(trimmed.data, { limitInputPixels: false })
        .resize({ width: widths.at(-1) })
        .webp({ quality: 42, effort: 6 })
        .toFile(fallback);
      console.log(`layer ${name}-fallback.webp ${kb(fallback)}K`);
    }
    manifest.layers[name] = { widths: sizes, ratio: Number(ratio.toFixed(4)) };
  }
  for (const [index, [left, top, width, height]] of creatureBoxes.entries()) {
    const target = `${OUT}/creature-${index + 1}.webp`;
    // Extract to a buffer first: sharp trims before extracting in one pipeline.
    const cut = await open(`${LAYERS}/endemitki.png`).extract({ left, top, width, height }).png().toBuffer();
    const info = await sharp(cut)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
      .toBuffer()
      // The sheet stores the creatures lying on their side: stand them up.
      .then(buffer => sharp(buffer).rotate(270).resize({ width: 200 }).toBuffer())
      .then(buffer => sharp(buffer))
      .then(image => image
      .webp({ quality: 84, alphaQuality: 90, effort: 6 })
      .toFile(target));
    manifest.creatures.push({ src: `creature-${index + 1}.webp`, ratio: Number((info.height / info.width).toFixed(4)) });
    console.log(`creature-${index + 1}.webp ${kb(target)}K`);
  }
}

// ---- photographs -----------------------------------------------------------
const photoSpecs = [
  // slug, source file, tone (day | night)
  ["river", "248CA8BE-B4D4-4B32-A929-406093888D44_1_105_c.jpeg", "day"],
  ["meadow-dome", "0D256157-3F1A-482E-AD1F-B205A2C6DED7_1_105_c.jpeg", "day"],
  ["sunbeam-tree", "A7407221.jpg", "day"],
  ["backlight", "AAM09086.jpg", "day"],
  ["smoke-dance-1", "A7407440.jpg", "day"],
  ["smoke-dance-2", "A7407445.jpg", "day"],
  ["smoke-dance-3", "A7407451.jpg", "day"],
  ["smoke-figure", "A7407368.jpg", "day"],
  ["afternoon-floor", "AAM09213.jpg", "day"],
  ["watermelon", "AAM09274.jpg", "day"],
  ["grass-crew", "AAM09275.jpg", "day"],
  ["white-curtain", "A7407100.jpg", "day"],
  ["dome-day", "CD43E33D-EBBF-45C0-BC27-BD9F3A15A3CB_1_105_c.jpeg", "day"],
  ["sign-sun", "A7406359.jpg", "day"],
  ["sign-tree", "A7406355.jpg", "day"],
  ["melon-slices", "AAM09262.jpg", "day"],
  ["tent-view", "IMG_20260815_195750.jpg", "day"],
  ["laser-dome-1", "63C0DEE9-5CE8-4AF5-A95F-39AF9E51ADC1_1_105_c.jpeg", "night"],
  ["laser-dome-2", "795C3ADF-5C34-4207-B6A8-99109BBDDB41_1_105_c.jpeg", "night"],
  ["laser-dome-3", "FD7DC568-2CB5-4AC4-B720-8F99AA350D3E_1_105_c.jpeg", "night"],
  ["silhouettes", "A7406467.jpg", "night"],
  ["lanterns", "A7406383.jpg", "night"],
  ["blue-floor", "A7406785.jpg", "night"],
  ["red-smoke", "EMA_0853.JPG", "night"],
  ["green-laser", "file_0000000033748243826a65aa9c3b46f8.png", "night"],
  ["booth", "AAM08809.jpg", "day"],
  ["teal-crowd", "A7406631.jpg", "night"],
  ["teal-light", "A7406592.jpg", "night"],
  ["blue-beam", "A7406758.jpg", "night"],
  ["night-bar", "A7406691.jpg", "night"],
  ["lantern-line", "A7406567.jpg", "night"],
  ["decks", "A7406659.jpg", "night"],
  ["disco", "54178455-8665-4896-9328-E5BB04EF470B_1_105_c.jpeg", "night"],
  ["purple-laser", "EMA_0802.JPG", "night"],
  ["violet-beam", "EMA_0898.JPG", "night"],
  ["green-dome", "EMA_0878.JPG", "night"],
  ["pink-sky", "Izvir 2026 1~2.jpg", "night"],
  ["blue-wide", "file_00000000c260820aae9002e3252514db~2.jpg", "night"],
  ["glow-creatures", "A7406519.jpg", "night"],
  ["blue-smoke", "7119F5D1-1380-46C3-AA4F-3B17B8AD5FFD_1_105_c.jpeg", "day"],
  ["dancers", "AAM08780.jpg", "day"],
  ["curtain-path", "A7407178.jpg", "day"],
  ["dome-dj", "A7407063.jpg", "day"],
  ["smoke-jump", "A7407410.jpg", "day"],
  ["drava-meadow", "854537A6-22A9-4EA4-8282-EE81C39C60D1_1_105_c.jpeg", "place"],
  ["drava-bank", "B785D58E-E1EA-4403-9CEF-DCCB75FA8CA2_1_105_c.jpeg", "place"],
  ["hall", "0C714971-5F00-4ADD-99E6-8EBAC1AA25EA_1_105_c.jpeg", "place"],
  ["fog-tree", "6B670FAD-ED7B-441D-8596-1BA5DAB82959_1_105_c.jpeg", "place"],
  ["lantern-path", "5B95BB7E-B0DB-4FDA-92CA-ED9A912720DD_1_105_c.jpeg", "place"],
  ["dome-frame", "324C98C9-CF63-4C85-A837-6532D25F32F4_1_105_c.jpeg", "place"],
  ["sign-meadow", "D0085142-782A-4A12-ADB5-DFAB3C7EC43C_1_105_c.jpeg", "place"],
];

async function buildPhotos() {
  for (const [slug, file, tone] of photoSpecs) {
    const target = `${OUT}/photo-${slug}.webp`;
    const info = await sharp(`${PHOTOS}/${file}`)
      .rotate()
      .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 })
      .toFile(target);
    // Half-size copy for grids and the gallery wall.
    await sharp(`${PHOTOS}/${file}`)
      .rotate()
      .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 68, effort: 6 })
      .toFile(`${OUT}/photo-${slug}-640.webp`);
    manifest.photos.push({ slug, src: `photo-${slug}.webp`, width: info.width, height: info.height, tone });
    console.log(`photo-${slug}.webp ${info.width}x${info.height} ${kb(target)}K`);
  }
}

// ---- video -----------------------------------------------------------------
const loopSpecs = [
  // slug, source, start (s), duration (s), width
  ["lasers", FILM, 24.5, 4, 480],
  ["camp", FILM, 33.5, 4, 480],
  ["smoke", FILM, 44.5, 4, 480],
  ["meadow", FILM, 54, 4, 480],
  ["hands", FILM, 74.5, 4, 480],
  ["green", `${PHOTOS}/20260816_034155~2.mp4`, 2, 4, 640],
];

const ffmpeg = args =>
  execFileSync("ffmpeg", ["-nostdin", "-y", "-loglevel", "error", ...args], {
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 64 * 1024 * 1024,
  });

// This ffmpeg build has no WebP encoder: grab a PNG frame and encode with sharp.
async function poster(video, target, at = 0) {
  const frame = ffmpeg(["-ss", String(at), "-i", video, "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"]);
  await sharp(frame).webp({ quality: 68, effort: 6 }).toFile(target);
}

async function buildVideo() {
  for (const [slug, source, start, duration, width] of loopSpecs) {
    const target = `${OUT}/motion/loop-${slug}.mp4`;
    ffmpeg([
      "-ss", String(start), "-i", source, "-t", String(duration), "-an",
      "-vf", `scale=${width}:-2,fps=24`,
      "-c:v", "libx264", "-preset", "slow", "-crf", "29", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", target,
    ]);
    await poster(target, `${OUT}/motion/loop-${slug}.webp`);
    manifest.loops.push({ slug, src: `motion/loop-${slug}.mp4`, poster: `motion/loop-${slug}.webp` });
    console.log(`loop-${slug}.mp4 ${kb(target)}K, poster ${kb(`${OUT}/motion/loop-${slug}.webp`)}K`);
  }
  const film = `${OUT}/motion/film.mp4`;
  ffmpeg([
    "-i", FILM,
    "-vf", "scale=720:-2",
    "-c:v", "libx264", "-preset", "medium", "-crf", "27", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "112k", "-movflags", "+faststart", film,
  ]);
  await poster(film, `${OUT}/motion/film.webp`, 40);
  console.log(`film.mp4 ${kb(film)}K`);
}

if (run("layers")) await buildLayers();
if (run("photos")) await buildPhotos();
if (run("video")) await buildVideo();
if (!only) {
  writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
  console.log("manifest written");
}
