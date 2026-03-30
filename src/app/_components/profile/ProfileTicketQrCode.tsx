"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface ProfileTicketQrCodeProps {
  qrData: string;
  size?: number;
}

export default function ProfileTicketQrCode({
  qrData,
  size = 280,
}: ProfileTicketQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(qrData, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl);
  }, [qrData, size]);

  if (!qrDataUrl) {
    return (
      <div
        className="bg-neutral-700 rounded-lg animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={qrDataUrl}
      alt="Ticket QR Code"
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}
