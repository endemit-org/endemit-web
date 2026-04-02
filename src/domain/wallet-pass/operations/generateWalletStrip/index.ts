import sharp from "sharp";

// Apple Wallet strip dimensions
const STRIP_SIZES = {
  "@3x": { width: 1125, height: 432 },
  "@2x": { width: 750, height: 288 },
  "@1x": { width: 375, height: 144 },
} as const;

interface WalletStripData {
  eventImageUrl: string;
}

interface GeneratedStrips {
  "@3x": Buffer;
  "@2x": Buffer;
  "@1x": Buffer;
}

export async function generateWalletStrip(
  data: WalletStripData
): Promise<GeneratedStrips> {
  const { width, height } = STRIP_SIZES["@3x"];

  // Calculate the square image size (smaller to account for iOS cropping)
  const squareSize = Math.round(height * 0.6); // 60% of height (was ~80%, now 20% smaller)
  const padding = Math.round((height - squareSize) / 2); // Center vertically

  // Fetch and process the event image
  const eventImageBuffer = await fetchImage(data.eventImageUrl);

  // Create the blurred background (darker)
  const blurredBackground = await createBlurredBackground(
    eventImageBuffer,
    width,
    height
  );

  // Resize the square image for the center with shadow
  const squareImageWithShadow = await createSquareImageWithShadow(
    eventImageBuffer,
    squareSize
  );

  // Composite everything together for @3x
  const shadowPadding = 20; // Extra space for shadow
  const strip3x = await sharp(blurredBackground)
    .composite([
      {
        input: squareImageWithShadow,
        top: padding - shadowPadding,
        left: Math.round((width - squareSize) / 2) - shadowPadding,
      },
    ])
    .png()
    .toBuffer();

  // Scale down for @2x and @1x
  const strip2x = await sharp(strip3x)
    .resize(STRIP_SIZES["@2x"].width, STRIP_SIZES["@2x"].height)
    .png()
    .toBuffer();

  const strip1x = await sharp(strip3x)
    .resize(STRIP_SIZES["@1x"].width, STRIP_SIZES["@1x"].height)
    .png()
    .toBuffer();

  return {
    "@3x": strip3x,
    "@2x": strip2x,
    "@1x": strip1x,
  };
}

async function fetchImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function createBlurredBackground(
  imageBuffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  // First, resize the image to cover the strip dimensions
  // Then apply a strong blur and darken significantly
  return await sharp(imageBuffer)
    .resize(width, height, {
      fit: "cover",
      position: "center",
    })
    .blur(50) // Strong blur for background effect
    .modulate({
      brightness: 0.4, // Darken significantly for contrast with center image
    })
    .png()
    .toBuffer();
}

async function createSquareImageWithShadow(
  imageBuffer: Buffer,
  size: number
): Promise<Buffer> {
  const shadowPadding = 20;
  const shadowBlur = 15;
  const totalSize = size + shadowPadding * 2;

  // Resize the square image
  const squareImage = await sharp(imageBuffer)
    .resize(size, size, {
      fit: "cover",
      position: "center",
    })
    .png()
    .toBuffer();

  // Create a shadow layer (dark semi-transparent rectangle, blurred)
  const shadowSvg = `
    <svg width="${totalSize}" height="${totalSize}">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="${shadowBlur}" flood-color="black" flood-opacity="0.5"/>
        </filter>
      </defs>
      <rect
        x="${shadowPadding}"
        y="${shadowPadding}"
        width="${size}"
        height="${size}"
        fill="black"
        filter="url(#shadow)"
      />
    </svg>
  `;

  // Composite shadow and image
  return await sharp({
    create: {
      width: totalSize,
      height: totalSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: Buffer.from(shadowSvg), top: 0, left: 0 },
      { input: squareImage, top: shadowPadding, left: shadowPadding },
    ])
    .png()
    .toBuffer();
}
