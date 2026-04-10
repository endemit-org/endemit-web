"use client";

import { useState } from "react";
import { addDoorSaleTicketsAction } from "@/domain/ticket/actions/addDoorSaleTicketsAction";
import UserAutocomplete from "@/app/_components/admin/UserAutocomplete";
import { formatPrice } from "@/lib/util/formatting";

interface DoorSaleFormProps {
  eventId: string;
  eventName: string;
  cashTicketPrice: number;
  onTicketAdded?: () => void;
}

export default function DoorSaleForm({
  eventId,
  eventName,
  cashTicketPrice,
  onTicketAdded,
}: DoorSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [totalAmount, setTotalAmount] = useState(cashTicketPrice);
  const [email, setEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const pricePerTicket = Math.round(totalAmount / quantity);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(20, quantity + delta));
    setQuantity(newQuantity);
    setTotalAmount(newQuantity * cashTicketPrice);
    setShowConfirm(false);
  };

  const handleTotalChange = (value: string) => {
    const euros = parseInt(value || "0", 10);
    if (!isNaN(euros) && euros >= 0) {
      setTotalAmount(euros * 100);
    }
  };

  const handleProceedToConfirm = () => {
    setError(null);
    setShowConfirm(true);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  const handleConfirmCashReceived = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await addDoorSaleTicketsAction({
        eventId,
        eventName,
        quantity,
        totalPrice: totalAmount,
        ticketHolderEmail: email || undefined,
        sendEmail: sendEmail && !!email,
      });

      if (!result.success) {
        setError(result.error || "Failed to create tickets");
        setShowConfirm(false);
        return;
      }

      const ticketText = result.ticketCount === 1 ? "ticket" : "tickets";
      setSuccess(
        `${result.ticketCount} door sale ${ticketText} created for ${formatPrice(totalAmount / 100)}${sendEmail && email ? " - email sent" : ""}`
      );
      setQuantity(1);
      setTotalAmount(cashTicketPrice);
      setEmail("");
      setSendEmail(false);
      setShowConfirm(false);
      onTicketAdded?.();

      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = () => {
    setSendEmail(true);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 w-full md:max-w-md">
      <h3 className="font-semibold text-gray-900 mb-4">
        Door Sale - Cash Payment
      </h3>

      {!showConfirm ? (
        <div className="space-y-4">
          {/* Quantity selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Tickets
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="w-12 h-12 flex items-center justify-center rounded-lg border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold"
              >
                -
              </button>
              <span className="text-3xl font-bold w-16 text-center text-gray-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 20}
                className="w-12 h-12 flex items-center justify-center rounded-lg border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Editable total price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Amount (editable)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
                €
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={Math.round(totalAmount / 100)}
                onChange={e => handleTotalChange(e.target.value)}
                className="w-full pl-8 pr-4 py-3 text-2xl font-bold text-gray-900 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {quantity} tickets × {formatPrice(pricePerTicket / 100)} each
            </div>
          </div>

          {/* Optional email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (optional)
            </label>
            <UserAutocomplete
              value={email}
              onChange={setEmail}
              onUserSelect={handleUserSelect}
              placeholder="Search user or enter email"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty for anonymous door sale
            </p>
          </div>

          {email && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="send-email"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="send-email" className="text-sm text-gray-700">
                Send tickets via email
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={handleProceedToConfirm}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Proceed - {formatPrice(totalAmount / 100)}
          </button>
        </div>
      ) : (
        /* Confirmation screen */
        <div className="space-y-4">
          <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-400">
            <div className="text-center">
              <div className="text-lg font-medium text-yellow-800 mb-2">
                Confirm Cash Received
              </div>
              <div className="text-4xl font-bold text-yellow-900 mb-2">
                {formatPrice(totalAmount / 100)}
              </div>
              <div className="text-sm text-yellow-700">
                for {quantity} ticket{quantity > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancelConfirm}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmCashReceived}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Cash Received"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
