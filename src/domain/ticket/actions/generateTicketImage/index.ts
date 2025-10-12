import QRCode from "qrcode";
import path from "path";
import sharp from "sharp";

export const generateTicketImage = async (data: string): Promise<string> => {
  const qrCodeDataUrl = await QRCode.toDataURL(data, {
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

  return qrBuffer.toString("base64");
};
