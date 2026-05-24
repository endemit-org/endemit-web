"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  receiveCode: string;
}

export default function ReceiveFundsCard({ receiveCode }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(receiveCode, {
      width: 256,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [receiveCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiveCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-neutral-900 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold text-neutral-200 mb-1">
        Receive funds
      </h3>
      <p className="text-sm text-neutral-400 mb-4">
        Show this QR to another user — they can scan it from their wallet to
        send you tokens.
      </p>

      <div className="flex items-center gap-4">
        <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="Receive QR"
              className="w-full h-full rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 rounded-lg animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
            Or share code
          </p>
          <p className="text-xs font-mono text-neutral-400 break-all mb-2">
            {receiveCode}
          </p>
          <button
            onClick={handleCopy}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {copied ? "Copied!" : "Copy code"}
          </button>
        </div>
      </div>
    </div>
  );
}
