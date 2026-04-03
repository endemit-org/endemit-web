"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import ProfileTicketQrCode from "./ProfileTicketQrCode";
import ProfileTicketDownloadButton from "./ProfileTicketDownloadButton";
import LiveTicketIndicator from "./LiveTicketIndicator";
import AddToWalletButton from "@/app/_components/ticket/AddToWalletButton";
import AnimatedSuccessIcon from "@/app/_components/icon/AnimatedSuccessIcon";
import { formatPrice } from "@/lib/util/formatting";
import { updateTicketHolderNameAction } from "@/domain/ticket/actions/updateTicketHolderNameAction";
import { regenerateTicketQrAction } from "@/domain/ticket/actions/regenerateTicketQrAction";

const statusColors: Record<string, string> = {
  VALIDATED: "bg-emerald-500/20 text-emerald-400",
  PENDING: "bg-emerald-500/20 text-emerald-400",
  SCANNED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  BANNED: "bg-red-500/20 text-red-400",
  REFUND_REQUESTED: "bg-orange-500/20 text-orange-400",
  REFUNDED: "bg-gray-500/20 text-gray-400",
};

const statusLabels: Record<string, string> = {
  VALIDATED: "Ready to scan",
  PENDING: "Ready to scan",
  SCANNED: "Used",
  CANCELLED: "Cancelled",
  BANNED: "Banned",
  REFUND_REQUESTED: "Refund Requested",
  REFUNDED: "Refunded",
};

interface TicketContentProps {
  ticket: {
    shortId: string;
    ticketHash: string;
    eventName: string;
    ticketHolderName: string;
    ticketPayerEmail: string;
    price: string | number;
    status: string;
    scanCount: number;
    qrContent: unknown;
    isGuestList: boolean;
  };
  event: {
    uid: string;
    name: string;
    date_start: Date | null;
    venue: { name: string } | null;
    promoImage: { src: string; alt: string | null } | null;
  } | null;
  initialScannedAt: string | null;
  formattedEventDate: string | null;
}

export default function TicketContent({
  ticket,
  event,
  initialScannedAt,
  formattedEventDate,
}: TicketContentProps) {
  const [status, setStatus] = useState(ticket.status);
  const [scannedAt, setScannedAt] = useState<string | null>(initialScannedAt);
  const [justScanned, setJustScanned] = useState(false);

  // Holder name editing state
  const [holderName, setHolderName] = useState(ticket.ticketHolderName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(ticket.ticketHolderName);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [qrContent, setQrContent] = useState(ticket.qrContent);

  const isUsable = status === "VALIDATED" || status === "PENDING";
  const qrData = qrContent ? JSON.stringify(qrContent) : ticket.ticketHash;

  // Rotate QR code hash every 5 seconds for anti-screenshot protection
  useEffect(() => {
    if (!isUsable) return;

    const rotateQr = async () => {
      const result = await regenerateTicketQrAction(ticket.shortId);
      if (result.success && result.qrContent) {
        setQrContent(result.qrContent);
      }
    };

    const interval = setInterval(rotateQr, 5000);
    return () => clearInterval(interval);
  }, [isUsable, ticket.shortId]);

  const handleScanEvent = useCallback(
    (payload: {
      ticketId: string;
      shortId: string;
      status: string;
      scannedAt: string;
    }) => {
      if (payload.shortId === ticket.shortId) {
        setStatus(payload.status);
        setScannedAt(payload.scannedAt);
        setJustScanned(true);
        setTimeout(() => setJustScanned(false), 5000);
      }
    },
    [ticket.shortId]
  );

  useRealtimeChannel({
    channelName: `ticket:${ticket.shortId}`,
    event: "ticket_scanned",
    onMessage: handleScanEvent,
  });

  const formatScannedAt = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSaveName = async () => {
    const trimmedName = editedName.trim();
    if (!trimmedName || trimmedName === holderName) {
      setIsEditingName(false);
      setEditedName(holderName);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const result = await updateTicketHolderNameAction(
      ticket.shortId,
      trimmedName
    );

    setIsSaving(false);

    if (result.success && result.newName) {
      setHolderName(result.newName);
      setEditedName(result.newName);
      setIsEditingName(false);
      if (result.newQrContent) {
        setQrContent(result.newQrContent);
      }
    } else {
      setSaveError(result.error || "Failed to save");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName(holderName);
    setSaveError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* QR Code Section */}
      <div
        className={`bg-neutral-950 rounded-lg p-6 mb-6 transition-all duration-500 relative overflow-hidden ${
          justScanned ? "ring-2 ring-blue-500 ring-opacity-50" : ""
        }`}
      >
        {isUsable && (
          <div className="w-full h-full absolute object-fill overflow-hidden opacity-60 top-0 left-0 z-0 ">
            <video
              src={"/images/dancing_bck.mp4"}
              loop={true}
              muted={true}
              autoPlay={true}
              playsInline={true}
              className={"w-full h-full object-cover"}
            />
          </div>
        )}
        <div className="text-center mb-6 relative z-10">
          <h2 className="text-4xl font-semibold text-neutral-200 mb-1 tracking-widest">
            {ticket.shortId}
          </h2>
          {formattedEventDate && (
            <p className="text-sm text-neutral-400">
              {" "}
              {ticket.eventName} · {formattedEventDate}
              {event && event.venue && ` · ${event.venue.name}`}
            </p>
          )}
        </div>
        {/* Status Badge */}
        <div className="flex justify-center gap-2 mb-6 relative z-10 ">
          <span
            className={`text-sm px-3 py-1 rounded-full transition-all ${
              justScanned ? "animate-pulse" : ""
            } ${statusColors[status] || "bg-gray-500/20 text-gray-400"}`}
          >
            {statusLabels[status] || status}
          </span>
          {ticket.isGuestList && (
            <span className="text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-400">
              Guest
            </span>
          )}
        </div>
        {/* QR Code */}
        {isUsable ? (
          <div className="flex flex-col items-center relative z-10">
            <div
              className={`p-4 rounded-xl mb-4 ${ticket.isGuestList ? "bg-neutral-900" : "bg-white"}`}
            >
              <ProfileTicketQrCode
                qrData={qrData}
                size={280}
                isGuestList={ticket.isGuestList}
              />
            </div>
            <p className="text-xs text-neutral-200 text-center">
              Show this QR code at the entrance
            </p>
            <LiveTicketIndicator ticketHash={ticket.ticketHash} />
          </div>
        ) : (
          <div className="text-center py-8">
            {status === "SCANNED" ? (
              <div
                className={`flex justify-center mb-4 ${justScanned ? "animate-bounce" : ""}`}
              >
                <AnimatedSuccessIcon
                  className="w-16 h-16"
                  color="#60a5fa"
                  strokeWidth={5}
                />
              </div>
            ) : (
              <div
                className={`w-16 h-16 mx-auto mb-4 bg-neutral-700 rounded-full flex items-center justify-center ${
                  justScanned ? "animate-bounce" : ""
                }`}
              >
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
            <p className="text-neutral-400">
              {status === "SCANNED"
                ? "This ticket has already been used"
                : "This ticket is no longer valid"}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isUsable && (
        <div className="space-y-3 mb-6">
          <ProfileTicketDownloadButton
            shortId={ticket.shortId}
            holderName={holderName}
          />
          <AddToWalletButton
            ticketHash={ticket.ticketHash}
            shortId={ticket.shortId}
          />
        </div>
      )}

      {/* Event Info */}
      {event && (
        <Link
          href={`/events/${event.uid}`}
          className="block bg-neutral-800 rounded-lg overflow-hidden mb-6 hover:bg-neutral-750 transition-colors group"
        >
          <div className="flex items-center gap-4 p-4">
            {event.promoImage?.src && (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={event.promoImage.src}
                  alt={event.promoImage.alt || event.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-neutral-200 font-medium truncate group-hover:text-white transition-colors">
                {event.name}
              </p>
              <p className="text-sm text-neutral-400">View event details</p>
            </div>
            <svg
              className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>
      )}

      {/* Ticket Details */}
      <div className="p-3 mb-6">
        <h3 className="text-lg font-semibold text-neutral-200 mb-4">
          Ticket Details
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-neutral-400">Ticket ID</span>
            <span className="text-neutral-200 font-mono">{ticket.shortId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Holder Name</span>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-neutral-700 text-neutral-200 px-2 py-1 rounded text-sm w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                >
                  {isSaving ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="text-neutral-400 hover:text-neutral-300 disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-neutral-200">{holderName}</span>
                {isUsable && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-neutral-500 hover:text-neutral-300 transition-colors"
                    title="Edit holder name"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          {saveError && (
            <div className="text-red-400 text-xs text-right">{saveError}</div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-400">Email</span>
            <span className="text-neutral-200">{ticket.ticketPayerEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Price</span>
            <span className="text-neutral-200">
              {formatPrice(Number(ticket.price))}
            </span>
          </div>
          {scannedAt && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Scanned at</span>
              <span className="text-neutral-200">
                {formatScannedAt(scannedAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
