"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";

interface ShortLinkQrModalProps {
  code: string;
  url: string;
  onClose: () => void;
}

/**
 * QR code preview and SVG download for a short link.
 *
 * SVG rather than PNG because these are printed — on posters, flyers and
 * stickers at any size — and a raster QR code at the wrong scale is the usual
 * cause of a code that will not scan.
 *
 * Error correction is set to "M": high enough to survive the ink bleed and
 * minor damage printed media picks up, without inflating the module count so
 * far that the code needs to be printed large to stay scannable.
 */
export default function ShortLinkQrModal({
  code,
  url,
  onClose,
}: ShortLinkQrModalProps) {
  const t = useTranslations("admin.shortLinks");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setSvg)
      .catch(() => setError(t("qrFailed")));
  }, [url, t]);

  // Escape closes, matching the other admin dialogs.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `qr-${code}.svg`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    // Rendered inside the admin subtree, but light-scheme + an explicit text
    // color are set here too: a dialog must not inherit white-on-white if it
    // is ever portaled out of the admin surface.
    <div
      className="light-scheme fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-gray-900"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={event => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">{t("qrTitle")}</h2>
        <p className="mt-1 break-all text-sm text-gray-500">{url}</p>

        <div className="my-5 flex justify-center">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : svg ? (
            <div
              className="w-56 [&>svg]:h-full [&>svg]:w-full"
              // qrcode generates the SVG markup itself; there is no user
              // content in it beyond the URL it encodes.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="h-56 w-56 animate-pulse rounded bg-gray-100" />
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadSvg}
            disabled={!svg}
            className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {t("qrDownload")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
