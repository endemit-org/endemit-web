"use client";

import { useState } from "react";
import { SerializedTicket } from "@/domain/ticket/types/ticket";
import {
  isTicketChecked,
  isTicketInvalid,
} from "@/domain/ticket/businessLogic";
import { formatPrice } from "@/lib/util/formatting";
import { generateTicketImageAction } from "@/domain/ticket/actions/generateTicketImageAction";
import clsx from "clsx";
import Link from "next/link";

interface AdminTicketDetailsDialogProps {
  ticket: SerializedTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminTicketDetailsDialog({
  ticket,
  isOpen,
  onClose,
}: AdminTicketDetailsDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadTicket = async () => {
    if (!ticket) return;

    setIsGenerating(true);
    setDownloadError(null);

    try {
      const result = await generateTicketImageAction(ticket.id);

      if (!result) {
        setDownloadError("No response from server");
        return;
      }

      if (!result.success || !result.image) {
        setDownloadError(result.error || "Failed to generate ticket");
        return;
      }

      // Create blob from base64 and download
      const byteCharacters = atob(result.image);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ticket-${ticket.shortId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      setDownloadError(
        error instanceof Error ? error.message : "Failed to generate ticket"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Ticket {ticket.shortId}
            </h2>
            {ticket.isGuestList && (
              <span className="rounded-full px-3 py-1 text-sm bg-purple-100 text-purple-800 font-medium">
                Guest List
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status</span>
            <span
              className={clsx(
                "px-3 py-1 rounded-full text-sm font-medium",
                isTicketInvalid(ticket) && "bg-red-100 text-red-800",
                isTicketChecked(ticket) && "bg-green-100 text-green-800",
                !isTicketInvalid(ticket) &&
                  !isTicketChecked(ticket) &&
                  "bg-blue-100 text-blue-800"
              )}
            >
              {ticket.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Short ID</span>
            <span className="font-mono">{ticket.shortId}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{ticket.ticketHolderName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span>{ticket.ticketPayerEmail}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Event</span>
            <span>{ticket.eventName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Price</span>
            <span className="font-medium">{formatPrice(ticket.price)}</span>
          </div>

          {ticket.scanCount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Scan Count</span>
              <span className="font-medium text-green-600">
                {ticket.scanCount}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-500">Order</span>
            <Link
              href={`/admin/orders`}
              className="text-blue-600 hover:text-blue-800 font-mono text-sm"
              onClick={e => e.stopPropagation()}
            >
              {ticket.orderId.slice(0, 12)}...
            </Link>
          </div>

          {downloadError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {downloadError}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleDownloadTicket}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Ticket
              </>
            )}
          </button>
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
