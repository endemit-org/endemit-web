"use client";

import { useState, useRef, useEffect } from "react";
import { SerializedTicket } from "@/domain/ticket/types/ticket";
import {
  isTicketChecked,
  isTicketInvalid,
  isTicketPending,
} from "@/domain/ticket/businessLogic";
import clsx from "clsx";

interface TicketDetailsDialogProps {
  ticket: SerializedTicket | null;
  isOpen: boolean;
  onClose: () => void;
  scanningEnabled: boolean;
  onConfirmAction: (ticket: SerializedTicket) => Promise<void>;
}

export default function TicketDetailsDialog({
  ticket,
  isOpen,
  onClose,
  onConfirmAction,
  scanningEnabled,
}: TicketDetailsDialogProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 3000;
  const PROGRESS_INTERVAL = 50;

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleMouseDown = () => {
    if (isProcessing || !ticket) return;

    setIsHolding(true);
    setProgress(0);

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (PROGRESS_INTERVAL / HOLD_DURATION) * 100;
        return next >= 100 ? 100 : next;
      });
    }, PROGRESS_INTERVAL);

    holdTimerRef.current = setTimeout(async () => {
      setIsProcessing(true);
      await onConfirmAction(ticket);
      setIsProcessing(false);
      resetHold();
      onClose();
    }, HOLD_DURATION);
  };

  const handleMouseUp = () => {
    resetHold();
  };

  const resetHold = () => {
    setIsHolding(false);
    setProgress(0);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 "
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 rounded-lg p-6 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-4 text-white text-center">
          Ticket {ticket.shortId}
        </h2>

        <div className="space-y-3 mb-6 text-neutral-300">
          <div className="flex justify-between">
            <span className="text-neutral-400">Status:</span>
            <span
              className={clsx(
                "font-mono",
                isTicketInvalid(ticket) && "text-red-800",
                isTicketChecked(ticket) && "text-green-600"
              )}
            >
              {ticket.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Short id:</span>
            <span className="font-mono">{ticket.shortId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Name:</span>
            <span>{ticket.ticketHolderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Email:</span>
            <span>{ticket.ticketPayerEmail}</span>
          </div>
          {ticket.scanCount > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Times scanned:</span>
              <span>{ticket.scanCount}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center mt-6">
          {isTicketPending(ticket) && scanningEnabled && (
            <button
              className="select-none relative flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              disabled={isProcessing}
            >
              <div
                className="absolute inset-0 bg-blue-800 transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
              <span className="relative z-10">
                {isProcessing
                  ? "Processing..."
                  : isHolding
                    ? "Hold..."
                    : "Hold to Scan"}
              </span>
            </button>
          )}

          <button
            className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            onClick={onClose}
            disabled={isProcessing}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
