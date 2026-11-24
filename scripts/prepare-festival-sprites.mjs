// Cuts the painted sheets with several loose drawings (tents, creatures v2)
// into one trimmed WebP per drawing. Run: node scripts/prepare-festival-sprites.mjs
import sharp from "sharp";

const LAYERS = "festival-vib-graphics/layered graphic";
const OUT = "public/images/festival/2027";

// name, file, exported widths (largest first), quality
const sheets = [
  ["tent", "sotori.png", [520, 280], 80],
  ["sprite", "endemitki_v2.png", [160, 80], 82],
];

/** Bounding boxes of the separate drawings, found on a small alpha map. */
async function findBoxes(file) {
  const scale = 8;
  const meta = await sharp(file, { limitInputPixels: false }).metadata();
  const width = Math.round(meta.width / scale);
  const { data, info } = await sharp(file, { limitInputPixels: false })
    .resize({ width })
    .extractChannel("alpha")
    // Blur bridges the loose brush strokes of one drawing.
    .blur(4)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(data.length);
  const boxes = [];
  for (let start = 0; start < data.length; start++) {
    if (seen[start] || data[start] < 12) continue;
    let [x0, y0, x1, y1] = [info.width, info.height, 0, 0];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const at = stack.pop();
      const x = at % info.width;
      const y = (at - x) / info.width;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const next of [at - 1, at + 1, at - info.width, at + info.width]) {
        if (next < 0 || next >= data.length || seen[next] || data[next] < 12) continue;
        if (Math.abs((next % info.width) - x) > 1) continue;
        seen[next] = 1;
        stack.push(next);
      }
    }
    if ((x1 - x0) * (y1 - y0) < 60) continue;
    const pad = 2;
    const left = Math.max(0, (x0 - pad) * scale);
    const top = Math.max(0, (y0 - pad) * scale);
    boxes.push({
      left: Math.round(left),
      top: Math.round(top),
      width: Math.min(meta.width - left, (x1 - x0 + 2 * pad) * scale),
      height: Math.min(meta.height - top, (y1 - y0 + 2 * pad) * scale),
    });
  }
  return boxes.sort((a, b) => a.left - b.left);
}

for (const [name, source, widths, quality] of sheets) {
  const file = `${LAYERS}/${source}`;
  const boxes = await findBoxes(file);
  for (const [index, box] of boxes.entries()) {
    // Extract and trim in two passes: sharp cannot combine them in one pipeline.
    const piece = await sharp(file, { limitInputPixels: false }).extract(box).png({ compressionLevel: 1 }).toBuffer();
    const cut = await sharp(piece).trim({ threshold: 1 }).png({ compressionLevel: 1 }).toBuffer({ resolveWithObject: true });
    for (const width of widths) {
      await sharp(cut.data).resize({ width }).webp({ quality, alphaQuality: 85, effort: 6 }).toFile(`${OUT}/${name}-${index + 1}-${width}.webp`);
    }
    console.log(`${name}-${index + 1}`, cut.info.width, cut.info.height, (cut.info.height / cut.info.width).toFixed(4));
  }
}
