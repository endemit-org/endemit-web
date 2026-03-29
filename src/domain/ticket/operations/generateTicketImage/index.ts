import "server-only";

import QRCode from "qrcode";
import path from "path";
import sharp from "sharp";
import satori from "satori";
import fs from "fs";
import type { ReactElement } from "react";
import type { TicketTemplateId, TicketTemplate } from "../../types/ticketTemplate";
import { getTemplateById, DEFAULT_TEMPLATE } from "../../config/ticketTemplates";

interface TicketData {
  shortId: string;
  hashId: string;
  qrData: string;
  eventName: string;
  eventDetails: string;
  eventDate: string;
  attendeeName: string;
  attendeeEmail: string;
  artists: string[];
  price: string;
  coverImageUrl: string;
  template?: string; // Template name - resolved by getTemplateById, defaults to "default"
}

interface TicketConfig {
  canvasWidth: number;
  canvasHeight: number;
  borderWidth: number;
  qrSize: number;
  logoSize: number;
  coverImageSize: number;
}

const DEFAULT_CONFIG: TicketConfig = {
  canvasWidth: 1080,
  canvasHeight: 1920,
  borderWidth: 8,
  qrSize: 780,
  logoSize: 55,
  coverImageSize: 400,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

export const generateTicketImage = async (
  ticketData: TicketData,
  config: Partial<TicketConfig> = {}
): Promise<string> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const template = ticketData.template
    ? getTemplateById(ticketData.template)
    : DEFAULT_TEMPLATE;
  const scheme = template.colorScheme;
  const bgColor = hexToRgb(scheme.background);

  const qrBuffer = await createQRCode(ticketData.qrData, cfg, template);
  const coverImageBuffer = await fetchAndResizeImage(
    ticketData.coverImageUrl,
    cfg.coverImageSize
  );
  const logoBuffer = await loadLogo(cfg.logoSize, template.invertLogo);
  const endemitLogoBuffer = await loadEndemitLogo(200, template.invertLogo);

  const qrMetadata = await sharp(qrBuffer).metadata();
  const qrWidth = qrMetadata.width || 420;
  const qrHeight = qrMetadata.height || 420;

  const layout = calculateLayout(cfg, qrWidth, qrHeight);
  const textSvg = await createTextOverlay(ticketData, cfg, layout, template);
  const infoSquare = await createColoredSquare(650, 900, scheme.text);

  const ticketBuffer = await sharp({
    create: {
      width: cfg.canvasWidth,
      height: cfg.canvasHeight,
      channels: 4,
      background: { r: bgColor.r, g: bgColor.g, b: bgColor.b, alpha: 1 },
    },
  })
    .composite([
      createBorder(cfg, scheme.border),
      { input: qrBuffer, top: layout.qrTop, left: layout.qrLeft },
      { input: logoBuffer, top: 10, left: 10 },
      { input: logoBuffer, top: 1855, left: 1015 },
      { input: infoSquare, top: 1100, left: layout.blackSquareLeft },
      {
        input: coverImageBuffer,
        top: layout.coverTop,
        left: layout.coverLeft,
      },
      { input: endemitLogoBuffer, top: 1730, left: layout.centerX - 100 },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  return ticketBuffer.toString("base64");
};

async function createQRCode(
  hashId: string,
  cfg: TicketConfig,
  template: TicketTemplate
): Promise<Buffer> {
  const scheme = template.colorScheme;

  const qrCodeDataUrl = await QRCode.toDataURL(hashId, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: cfg.qrSize,
    color: { dark: scheme.qrDark, light: scheme.qrLight },
  });

  const logoBuffer = await loadLogo(cfg.logoSize, template.invertLogo);
  const qrLightRgb = hexToRgb(scheme.qrLight);

  const whitePadding = await sharp(
    Buffer.from(`
      <svg width="80" height="80">
        <rect x="0" y="0" width="80" height="80" fill="${scheme.qrLight}" fill-opacity="1" />
      </svg>`)
  )
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toBuffer();

  return await sharp(Buffer.from(qrCodeDataUrl.split(",")[1], "base64"))
    .composite([{ input: whitePadding, gravity: "center" }])
    .extend({
      top: 80,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: qrLightRgb.r, g: qrLightRgb.g, b: qrLightRgb.b, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function loadLogo(size: number, invertLogo: boolean = false): Promise<Buffer> {
  const logoFile = invertLogo ? "endemit-logo-light.png" : "endemit-logo.png";
  const logoPath = path.join(process.cwd(), "public", "images", logoFile);

  // Fallback to regular logo if light version doesn't exist
  const finalPath = fs.existsSync(logoPath)
    ? logoPath
    : path.join(process.cwd(), "public", "images", "endemit-logo.png");

  return await sharp(finalPath)
    .resize(size, size, {
      fit: "inside",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function loadEndemitLogo(size: number, invertLogo: boolean = false): Promise<Buffer> {
  const logoFile = invertLogo ? "endemit-light.png" : "endemit.png";
  const logoPath = path.join(process.cwd(), "public", "images", logoFile);

  // Fallback to regular logo if light version doesn't exist
  const finalPath = fs.existsSync(logoPath)
    ? logoPath
    : path.join(process.cwd(), "public", "images", "endemit.png");

  return await sharp(finalPath)
    .resize(size, size, {
      fit: "contain",
      position: "center",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function fetchAndResizeImage(
  url: string,
  size: number,
  fit: "cover" | "contain" = "cover"
): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  return await sharp(imageBuffer)
    .resize(size, size, {
      fit,
      position: "center",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function createColoredSquare(
  width: number,
  height: number,
  color: string
): Promise<Buffer> {
  const rgb = hexToRgb(color);
  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: rgb.r, g: rgb.g, b: rgb.b, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

function createBorder(cfg: TicketConfig, borderColor: string) {
  return {
    input: Buffer.from(`
      <svg width="${cfg.canvasWidth}" height="${cfg.canvasHeight}">
        <rect
          x="${cfg.borderWidth / 2 + 10}"
          y="${cfg.borderWidth / 2 + 10}"
          width="${cfg.canvasWidth - cfg.borderWidth - 20}"
          height="${cfg.canvasHeight - cfg.borderWidth - 20}"
          fill="none"
          stroke="${borderColor}"
          stroke-width="${cfg.borderWidth}"
        />
      </svg>
    `),
    top: 0,
    left: 0,
  };
}

function calculateLayout(cfg: TicketConfig, qrWidth: number, qrHeight: number) {
  const qrTopPadding = 100;
  const qrLeft = Math.floor((cfg.canvasWidth - qrWidth) / 2);
  const qrBottom = qrTopPadding + qrHeight;

  return {
    qrTop: qrTopPadding,
    qrLeft,
    qrBottom,
    coverTop: qrBottom + 50,
    coverLeft: Math.floor((cfg.canvasWidth - cfg.coverImageSize) / 2),
    blackSquareLeft: Math.floor((cfg.canvasWidth - 650) / 2),
    centerX: Math.floor(cfg.canvasWidth / 2),
    centerY: Math.floor(cfg.canvasHeight / 2),
  };
}

async function createTextOverlay(
  data: TicketData,
  cfg: TicketConfig,
  layout: ReturnType<typeof calculateLayout>,
  template: TicketTemplate
): Promise<string> {
  const fontRegular = fs.readFileSync(
    path.join(process.cwd(), "public", "fonts", "DIN_Condensed_Bold.ttf")
  );

  const scheme = template.colorScheme;
  const textContent = template.textContent;

  const eventInfo =
    `${data.eventName} · ${data.eventDate} · ${data.eventDetails}`.toUpperCase();
  const firstPart = data.hashId.slice(0, 64).toUpperCase();
  const secondPart = data.hashId.slice(64).toUpperCase();

  // Build price/label section based on template
  const priceSectionChildren: ReactElement[] = [];

  if (textContent.priceLabel) {
    // Custom label (e.g., "VIP PASS")
    priceSectionChildren.push({
      type: "div",
      props: {
        style: {
          position: "absolute",
          top: 1765,
          left: layout.centerX,
          transform: "translateX(-50%) translateY(-100%)",
          fontSize: 80,
          fontWeight: "bolder",
          color: scheme.accent,
          whiteSpace: "nowrap",
        },
        children: textContent.priceLabel,
      },
    } as ReactElement);

    // Optional tagline (e.g., "NOT FOR SALE")
    if (textContent.tagline) {
      priceSectionChildren.push({
        type: "div",
        props: {
          style: {
            position: "absolute",
            top: 1805,
            left: layout.centerX,
            transform: "translateX(-50%) translateY(-100%)",
            fontSize: 36,
            color: scheme.textSecondary,
            whiteSpace: "nowrap",
          },
          children: textContent.tagline,
        },
      } as ReactElement);
    }
  } else {
    // Standard price display
    priceSectionChildren.push({
      type: "div",
      props: {
        style: {
          position: "absolute",
          top: 1785,
          left: layout.centerX,
          transform: "translateX(-50%) translateY(-100%)",
          fontSize: 80,
          fontWeight: "bolder",
          color: scheme.accent,
          whiteSpace: "nowrap",
        },
        children: data.price,
      },
    } as ReactElement);
  }

  // Determine text color for info box (inverted from the info box background)
  const infoTextColor = scheme.background;

  const element: ReactElement = {
    type: "div",
    props: {
      style: {
        width: cfg.canvasWidth,
        height: cfg.canvasHeight,
        display: "flex",
        position: "relative",
        fontFamily: "DIN",
      },
      children: [
        // Header: TICKET ID
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 175,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 105,
              fontWeight: "bold",
              color: scheme.text,
              whiteSpace: "nowrap",
            },
            children: `TICKET ${data.shortId}`,
          },
        },
        // Left side event info (rotated)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1880,
              left: cfg.borderWidth + 30,
              transform: `rotate(-90deg)`,
              transformOrigin: "left top",
              fontSize: 40,
              color: scheme.text,
              letterSpacing: "1px",
              whiteSpace: "nowrap",
            },
            children: eventInfo,
          },
        },
        // Left side hash (rotated)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1880,
              left: cfg.borderWidth + 75,
              transform: `rotate(-90deg)`,
              transformOrigin: "left top",
              fontSize: 30,
              color: scheme.textSecondary,
              letterSpacing: "10px",
              fontWeight: "lighter",
              whiteSpace: "nowrap",
            },
            children: firstPart,
          },
        },
        // Right side event info (rotated)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1830,
              right: cfg.borderWidth + 25,
              transform: `rotate(90deg)`,
              transformOrigin: "right top",
              fontSize: 40,
              color: scheme.text,
              letterSpacing: "1px",
              whiteSpace: "nowrap",
            },
            children: eventInfo,
          },
        },
        // Right side hash (rotated)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: 25,
              right: cfg.borderWidth + 110,
              transform: `rotate(90deg)`,
              transformOrigin: "right bottom",
              fontSize: 30,
              color: scheme.textSecondary,
              letterSpacing: "10px",
              fontWeight: "lighter",
              whiteSpace: "nowrap",
            },
            children: secondPart,
          },
        },
        // Legal text
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1895,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 26,
              color: infoTextColor,
              whiteSpace: "nowrap",
            },
            children: textContent.legalText,
          },
        },
        // Attendee name
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1510,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 46,
              fontWeight: "bold",
              color: infoTextColor,
              whiteSpace: "nowrap",
            },
            children: data.attendeeName.toUpperCase(),
          },
        },
        // Attendee email
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1540,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 26,
              color: infoTextColor,
              whiteSpace: "nowrap",
            },
            children: data.attendeeEmail,
          },
        },
        // Artists
        ...data.artists.map((artist, i) => ({
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1610 + i * 50,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 30,
              color: infoTextColor,
              whiteSpace: "nowrap",
            },
            children: artist.toUpperCase(),
          },
        })),
        // Price section (either price or VIP PASS + tagline)
        ...priceSectionChildren,
      ],
    },
  } as ReactElement;

  const svg = await satori(element, {
    width: cfg.canvasWidth,
    height: cfg.canvasHeight,
    fonts: [
      {
        name: "DIN",
        data: fontRegular,
        weight: 700,
        style: "normal",
      },
    ],
  });

  return svg;
}
