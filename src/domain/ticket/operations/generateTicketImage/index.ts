import "server-only";

import QRCode from "qrcode";
import path from "path";
import sharp from "sharp";
import satori from "satori";
import fs from "fs";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import type { ReactElement } from "react";

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

export const generateTicketImage = async (
  ticketData: TicketData,
  config: Partial<TicketConfig> = {}
): Promise<string> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const qrBuffer = await createQRCode(ticketData.qrData, cfg);
  const coverImageBuffer = await fetchAndResizeImage(
    ticketData.coverImageUrl,
    cfg.coverImageSize
  );
  const logoBuffer = await loadLogo(cfg.logoSize);
  const endemitLogoBuffer = await fetchAndResizeImage(
    `${PUBLIC_BASE_WEB_URL}/images/endemit.png`,
    200,
    "contain"
  );

  const qrMetadata = await sharp(qrBuffer).metadata();
  const qrWidth = qrMetadata.width || 420;
  const qrHeight = qrMetadata.height || 420;

  const layout = calculateLayout(cfg, qrWidth, qrHeight);
  const textSvg = await createTextOverlay(ticketData, cfg, layout);
  const blackSquare = await createBlackSquare(650, 900);

  const ticketBuffer = await sharp({
    create: {
      width: cfg.canvasWidth,
      height: cfg.canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      createBorder(cfg),
      { input: qrBuffer, top: layout.qrTop, left: layout.qrLeft },
      { input: logoBuffer, top: 10, left: 10 },
      { input: logoBuffer, top: 1855, left: 1015 },
      { input: blackSquare, top: 1100, left: layout.blackSquareLeft },
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
  cfg: TicketConfig
): Promise<Buffer> {
  const qrCodeDataUrl = await QRCode.toDataURL(hashId, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: cfg.qrSize,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const logoBuffer = await loadLogo(cfg.logoSize);

  const whitePadding = await sharp(
    Buffer.from(`
      <svg width="80" height="80">
        <rect x="0" y="0" width="80" height="80" fill="white" fill-opacity="1" />
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
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function loadLogo(size: number): Promise<Buffer> {
  const logoPath = path.join(
    process.cwd(),
    "public",
    "images",
    "endemit-logo.png"
  );
  return await sharp(logoPath)
    .resize(size, size, {
      fit: "inside",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
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

async function createBlackSquare(
  width: number,
  height: number
): Promise<Buffer> {
  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

function createBorder(cfg: TicketConfig) {
  return {
    input: Buffer.from(`
      <svg width="${cfg.canvasWidth}" height="${cfg.canvasHeight}">
        <rect
          x="${cfg.borderWidth / 2 + 10}"
          y="${cfg.borderWidth / 2 + 10}"
          width="${cfg.canvasWidth - cfg.borderWidth - 20}"
          height="${cfg.canvasHeight - cfg.borderWidth - 20}"
          fill="none"
          stroke="black"
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
  layout: ReturnType<typeof calculateLayout>
): Promise<string> {
  const fontRegular = fs.readFileSync(
    path.join(process.cwd(), "public", "fonts", "DIN_Condensed_Bold.ttf")
  );

  const eventInfo =
    `${data.eventName} · ${data.eventDate} · ${data.eventDetails}`.toUpperCase();
  const firstPart = data.hashId.slice(0, 64).toUpperCase();
  const secondPart = data.hashId.slice(64).toUpperCase();

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
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 145,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 85,
              fontWeight: "bold",
              color: "black",
              whiteSpace: "nowrap",
            },
            children: `TICKET ${data.shortId}`,
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: layout.centerY,
              left: cfg.borderWidth + 60,
              transform: `rotate(-90deg) translateX(-50%)`,
              transformOrigin: "0 0",
              fontSize: 40,
              color: "black",
              letterSpacing: "1px",
              whiteSpace: "nowrap",
            },
            children: eventInfo,
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: layout.centerY,
              left: cfg.borderWidth + 110,
              transform: `rotate(-90deg) translateX(-50%)`,
              transformOrigin: "0 0",
              fontSize: 30,
              color: "#AAAAAA",
              letterSpacing: "10px",
              fontWeight: "lighter",
              whiteSpace: "nowrap",
            },
            children: firstPart,
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: layout.centerY,
              right: cfg.borderWidth + 60,
              transform: `rotate(90deg) translateX(50%)`,
              transformOrigin: "100% 0",
              fontSize: 40,
              color: "black",
              whiteSpace: "nowrap",
            },
            children: eventInfo,
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: layout.centerY,
              right: cfg.borderWidth + 110,
              transform: `rotate(90deg) translateX(50%)`,
              transformOrigin: "100% 0",
              fontSize: 30,
              color: "#AAAAAA",
              letterSpacing: "10px",
              fontWeight: "lighter",
              whiteSpace: "nowrap",
            },
            children: secondPart,
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1895,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 26,
              color: "white",
              whiteSpace: "nowrap",
            },
            children: "Ticket admits one person. Ticket is non-refundable.",
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1490,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 46,
              fontWeight: "bold",
              color: "white",
              whiteSpace: "nowrap",
            },
            children: data.attendeeName.toUpperCase(),
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1530,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 26,
              color: "white",
              whiteSpace: "nowrap",
            },
            children: data.attendeeEmail,
          },
        },
        ...data.artists.map((artist, i) => ({
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1610 + i * 50,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 30,
              color: "white",
              whiteSpace: "nowrap",
            },
            children: artist.toUpperCase(),
          },
        })),
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 1765,
              left: layout.centerX,
              transform: "translateX(-50%) translateY(-100%)",
              fontSize: 80,
              fontWeight: "bolder",
              color: "#222222",
              whiteSpace: "nowrap",
            },
            children: data.price,
          },
        },
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
