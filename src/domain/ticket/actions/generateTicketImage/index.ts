import QRCode from "qrcode";
import path from "path";
import sharp from "sharp";

export const generateTicketImage = async (
  ticketHashId: string
): Promise<string> => {
  const qrCodeDataUrl = await QRCode.toDataURL(ticketHashId, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 400,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  const logoPath = path.join(
    process.cwd(),
    "public",
    "images",
    "endemit-logo.png"
  );
  const logoBuffer = await sharp(logoPath)
    .resize(55, 55, {
      fit: "inside",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  const paddingWidth = 80;
  const paddingHeight = 80;
  const cornerRadius = 0;

  const whitePadding = await sharp(
    Buffer.from(`
    <svg width="${paddingWidth}" height="${paddingHeight}">
      <rect
        x="0"
        y="0"
        width="${paddingWidth}"
        height="${paddingHeight}"
        rx="${cornerRadius}"
        fill="white"
        fill-opacity="1"
      />
    </svg>`)
  )
    .composite([
      {
        input: logoBuffer,
        gravity: "center",
      },
    ])
    .png()
    .toBuffer();

  const qrBuffer = await sharp(
    Buffer.from(qrCodeDataUrl.split(",")[1], "base64")
  )
    .composite([
      {
        input: whitePadding,
        gravity: "center",
      },
    ])
    .extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  // 9:16 portrait dimensions
  const canvasWidth = 1080;
  const canvasHeight = 1920;
  const borderWidth = 20;
  const qrTopPadding = 80;

  const qrMetadata = await sharp(qrBuffer).metadata();
  const qrWidth = qrMetadata.width || 420;
  // const qrHeight = qrMetadata.height || 420;
  const qrLeft = Math.floor((canvasWidth - qrWidth) / 2);

  const ticketBuffer = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="${canvasWidth}" height="${canvasHeight}">
            <rect x="${borderWidth / 2}" y="${borderWidth / 2}"
                  width="${canvasWidth - borderWidth}"
                  height="${canvasHeight - borderWidth}"
                  fill="none"
                  stroke="black"
                  stroke-width="${borderWidth}"/>
          </svg>
        `),
        top: 0,
        left: 0,
      },
      {
        input: qrBuffer,
        top: qrTopPadding,
        left: qrLeft,
      },
    ])
    .png()
    .toBuffer();

  return ticketBuffer.toString("base64");
};
