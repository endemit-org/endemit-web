"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

  const logoSize = 43;

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
    <div className="relative" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="Ticket QR Code"
        className="rounded-lg"
        style={{ width: size, height: size }}
      />
      {/* Logo overlay */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-sm"
        style={{ width: logoSize + 8, height: logoSize + 8 }}
      >
        <Image
          src="/images/endemit-logo.png"
          alt="Endemit"
          width={logoSize}
          height={logoSize}
          className="object-contain"
        />
      </div>
    </div>
  );
}
