"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

interface ProfileTicketQrCodeProps {
  qrData: string;
  size?: number;
  isGuestList?: boolean;
}

export default function ProfileTicketQrCode({
  qrData,
  size = 280,
  isGuestList = false,
}: ProfileTicketQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const logoSize = 43;

  useEffect(() => {
    QRCode.toDataURL(qrData, {
      width: size,
      margin: 2,
      color: {
        dark: isGuestList ? "#ffffff" : "#000000",
        light: isGuestList ? "#171717" : "#ffffff",
      },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl);
  }, [qrData, size, isGuestList]);

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
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 rounded-sm ${isGuestList ? "bg-neutral-900" : "bg-white"}`}
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
