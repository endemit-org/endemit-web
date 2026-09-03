import "server-only";

import path from "node:path";
import sharp from "sharp";

/**
 * The ENDEMIT wordmark as a 1-bit ePOS-Print raster. The source asset is
 * white-on-transparent, so the alpha channel is the ink coverage. Packed
 * MSB-first, one bit per dot, rows padded to whole bytes — the format the
 * <image> element expects. Built once per process and cached.
 */

// 576 printable dots on 80mm @ 203dpi; the wordmark at 400 leaves margins.
const LOGO_DOT_WIDTH = 400;

export interface EposLogo {
  width: number;
  height: number;
  base64: string;
}

let cached: Promise<EposLogo> | null = null;

async function buildLogo(): Promise<EposLogo> {
  const file = path.join(process.cwd(), "public", "images", "endemit.png");
  const { data, info } = await sharp(file)
    .resize({ width: LOGO_DOT_WIDTH })
    .ensureAlpha()
    .extractChannel("alpha")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bytesPerRow = (info.width + 7) >> 3;
  const packed = Buffer.alloc(bytesPerRow * info.height);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] >= 128) {
        packed[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }

  return {
    width: info.width,
    height: info.height,
    base64: packed.toString("base64"),
  };
}

export function getReceiptLogo(): Promise<EposLogo> {
  cached ??= buildLogo().catch(err => {
    cached = null; // allow retry on transient failure
    throw err;
  });
  return cached;
}
