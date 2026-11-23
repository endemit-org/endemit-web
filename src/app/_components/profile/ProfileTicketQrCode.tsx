"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";

interface ProfileTicketQrCodeProps {
  qrData: string;
  shortId: string;
  holderName: string;
  /** Rendered under the code in the fullscreen view (e.g. the live indicator). */
  fullscreenFooter?: ReactNode;
}

/**
 * Ticket QR for the door scanner. Always dark-on-white, vector (sharp at any
 * pixel density), with the full 4-module quiet zone and nothing covering the
 * modules. Tap opens a white fullscreen view that also lights the code.
 */
export default function ProfileTicketQrCode({
  qrData,
  shortId,
  holderName,
  fullscreenFooter,
}: ProfileTicketQrCodeProps) {
  const t = useTranslations("profile");
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toString(qrData, {
      type: "svg",
      margin: 4,
      errorCorrectionLevel: "Q",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(svg => {
        if (!cancelled) {
          setQrSrc(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
        }
      })
      .catch(() => {
        if (!cancelled) setQrSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [qrData]);

  // Keep the screen awake while the ticket is on display, so it doesn't dim
  // or lock in the queue. Re-acquired when the tab becomes visible again.
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        ?.request("screen")
        .then(lock => {
          if (released) {
            lock.release().catch(() => {});
            return;
          }
          sentinel = lock;
        })
        .catch(() => {});
    };

    acquire();
    document.addEventListener("visibilitychange", acquire);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", acquire);
      sentinel?.release().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  if (!qrSrc) {
    return (
      <div className="w-full aspect-square bg-neutral-200 rounded-lg animate-pulse" />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsFullscreen(true)}
        aria-label={t("tickets.enlargeQr")}
        className="block w-full bg-white rounded-lg overflow-hidden cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt={t("tickets.qrAlt")}
          className="block w-full aspect-square"
        />
      </button>

      {isFullscreen &&
        // Portal to <body>: ancestors' stacking contexts would trap the
        // overlay. It is a light surface, so it sets its own text color and
        // light color-scheme.
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("tickets.qrAlt")}
            onClick={() => setIsFullscreen(false)}
            className="light-scheme fixed inset-0 z-[100] bg-white text-neutral-900 flex flex-col items-center justify-center gap-4 p-4 cursor-zoom-out"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={t("tickets.qrAlt")}
              className="block aspect-square"
              style={{ width: "min(100vw - 2rem, 100dvh - 16rem, 32rem)" }}
            />
            <div className="text-center">
              <div className="text-5xl font-semibold tracking-widest">
                {shortId}
              </div>
              <div className="text-lg mt-1">{holderName}</div>
            </div>
            {fullscreenFooter}
            <p className="text-sm text-neutral-500 text-center">
              {t("tickets.brightnessHint")}
              <br />
              {t("tickets.tapToClose")}
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
