import "server-only";

import { list } from "@vercel/blob";

const BLOB_PATH_PREFIX = "wallet-strips";

export interface WalletStripUrls {
  strip: string | null;
  strip2x: string | null;
  strip3x: string | null;
}

/**
 * Get the blob storage URLs for an event's wallet strip images
 */
export async function getWalletStripUrls(
  eventId: string
): Promise<WalletStripUrls> {
  try {
    const { blobs } = await list({
      prefix: `${BLOB_PATH_PREFIX}/${eventId}/`,
    });

    const urls: WalletStripUrls = {
      strip: null,
      strip2x: null,
      strip3x: null,
    };

    for (const blob of blobs) {
      if (blob.pathname.endsWith("strip@3x.png")) {
        urls.strip3x = blob.url;
      } else if (blob.pathname.endsWith("strip@2x.png")) {
        urls.strip2x = blob.url;
      } else if (blob.pathname.endsWith("strip.png")) {
        urls.strip = blob.url;
      }
    }

    return urls;
  } catch (error) {
    console.error(`Failed to get wallet strip URLs for event ${eventId}:`, error);
    return { strip: null, strip2x: null, strip3x: null };
  }
}

export interface WalletStripBuffers {
  strip: Buffer | null;
  strip2x: Buffer | null;
  strip3x: Buffer | null;
}

/**
 * Fetch strip images from blob storage and return as buffers
 */
export async function fetchStripImages(
  eventId: string
): Promise<WalletStripBuffers> {
  const urls = await getWalletStripUrls(eventId);

  const fetchBuffer = async (url: string | null): Promise<Buffer | null> => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  };

  const [strip, strip2x, strip3x] = await Promise.all([
    fetchBuffer(urls.strip),
    fetchBuffer(urls.strip2x),
    fetchBuffer(urls.strip3x),
  ]);

  return { strip, strip2x, strip3x };
}
