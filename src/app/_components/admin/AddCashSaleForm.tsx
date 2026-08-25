"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { addCashSaleTicketsAction } from "@/domain/ticket/actions/addCashSaleTicketsAction";
import ActionButton from "@/app/_components/form/ActionButton";
import UserAutocomplete from "./UserAutocomplete";

interface AddCashSaleFormProps {
  eventId: string;
  eventName: string;
  onTicketAdded?: () => void;
}

/**
 * Admin cash sale: door-sale backend, but tickets always stay PENDING, each
 * has an assigned holder name, and one total price covers all tickets.
 */
export default function AddCashSaleForm({
  eventId,
  eventName,
  onTicketAdded,
}: AddCashSaleFormProps) {
  const t = useTranslations("admin.tickets.cashSaleForm");
  const tc = useTranslations("admin.common");
  const terr = useTranslations("admin.common.errors");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [names, setNames] = useState<string[]>([""]);
  const [totalPrice, setTotalPrice] = useState("");
  const [email, setEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTicketCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(10, count));
    setTicketCount(newCount);

    if (newCount > names.length) {
      setNames([...names, ...Array(newCount - names.length).fill("")]);
    } else {
      setNames(names.slice(0, newCount));
    }
  };

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await addCashSaleTicketsAction({
        eventId,
        eventName,
        ticketHolders: names.map(name => ({ name: name.trim() })),
        totalPrice: Math.round(parseFloat(totalPrice) * 100),
        ticketHolderEmail: email || undefined,
        sendEmail: sendEmail && !!email,
      });

      if (!result.success) {
        setError(result.error || terr("createTicketsFailed"));
        return;
      }

      setSuccess(t("successCreated", { count: result.ticketCount ?? 0 }));
      setTicketCount(1);
      setNames([""]);
      setTotalPrice("");
      setEmail("");
      setSendEmail(false);
      onTicketAdded?.();

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : terr("generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const allNamesValid = names.every(name => name.trim().length > 0);
  const priceValid =
    totalPrice !== "" && !isNaN(parseFloat(totalPrice)) && parseFloat(totalPrice) >= 0;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {t("addButton")}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{t("title")}</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-5 h-5"
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="cash-ticket-count"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("numberOfTickets")}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTicketCountChange(ticketCount - 1)}
              disabled={ticketCount <= 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <input
              type="number"
              id="cash-ticket-count"
              value={ticketCount}
              onChange={e =>
                handleTicketCountChange(parseInt(e.target.value) || 1)
              }
              min={1}
              max={10}
              className="w-16 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => handleTicketCountChange(ticketCount + 1)}
              disabled={ticketCount >= 10}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {t("holderNames")}
          </label>
          {names.map((name, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
              <input
                type="text"
                value={name}
                onChange={e => handleNameChange(index, e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t("holderNamePlaceholder", { number: index + 1 })}
              />
            </div>
          ))}
        </div>

        <div>
          <label
            htmlFor="cash-total-price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("totalPrice")}
          </label>
          <input
            type="number"
            id="cash-total-price"
            value={totalPrice}
            onChange={e => setTotalPrice(e.target.value)}
            step="0.01"
            min="0"
            required
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="0.00"
          />
          <p className="mt-1 text-xs text-gray-500">{t("totalPriceHint")}</p>
        </div>

        <div>
          <label
            htmlFor="cash-sale-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("emailLabel")}
          </label>
          <UserAutocomplete
            value={email}
            onChange={setEmail}
            placeholder={t("emailPlaceholder")}
          />
          <p className="mt-1 text-xs text-gray-500">{t("emailHint")}</p>
        </div>

        {email && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cash-send-email"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="cash-send-email" className="text-sm text-gray-700">
              {t("sendViaEmail")}
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

        <div className="flex gap-2">
          <ActionButton
            type="submit"
            disabled={isSubmitting || !allNamesValid || !priceValid}
            variant="primary"
            size="sm"
          >
            {isSubmitting
              ? t("creating")
              : t("createButton", { count: ticketCount })}
          </ActionButton>
          <ActionButton
            type="button"
            onClick={() => setIsOpen(false)}
            variant="secondary"
            size="sm"
          >
            {tc("cancel")}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
