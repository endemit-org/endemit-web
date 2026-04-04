"use client";

import { useState } from "react";
import { addGuestTicketsAction } from "@/domain/ticket/actions/addGuestTicketAction";
import ActionButton from "@/app/_components/form/ActionButton";
import UserAutocomplete from "./UserAutocomplete";

const NO_EMAIL_PLACEHOLDER = "guest@import.endemit.org";

interface AddGuestTicketFormProps {
  eventId: string;
  eventName: string;
  onTicketAdded?: () => void;
}

export default function AddGuestTicketForm({
  eventId,
  eventName,
  onTicketAdded,
}: AddGuestTicketFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [names, setNames] = useState<string[]>([""]);
  const [email, setEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTicketCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(10, count));
    setTicketCount(newCount);

    // Adjust names array
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

  const handleUserSelect = (user: { name: string | null }) => {
    // Auto-fill the first name if it's empty and we only have one ticket
    if (ticketCount === 1 && names[0] === "" && user.name) {
      setNames([user.name]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await addGuestTicketsAction({
        eventId,
        eventName,
        ticketHolders: names.map(name => ({ name: name.trim() })),
        ticketHolderEmail: sendEmail ? email : NO_EMAIL_PLACEHOLDER,
        sendEmail,
      });

      if (!result.success) {
        setError(result.error || "Failed to create tickets");
        return;
      }

      const ticketText = result.ticketCount === 1 ? "ticket" : "tickets";
      setSuccess(
        `${result.ticketCount} guest ${ticketText} created${sendEmail ? " and email sent" : ""}`
      );
      setTicketCount(1);
      setNames([""]);
      setEmail("");
      setSendEmail(false);
      onTicketAdded?.();

      // Auto-close success message
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allNamesValid = names.every(name => name.trim().length > 0);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Guest Ticket
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Add Guest List Tickets</h3>
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
            htmlFor="ticket-count"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Number of Tickets
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
              id="ticket-count"
              value={ticketCount}
              onChange={e =>
                handleTicketCountChange(parseInt(e.target.value) || 1)
              }
              min={1}
              max={10}
              className="w-16 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
            Ticket Holder Names
          </label>
          {names.map((name, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
              <input
                type="text"
                value={name}
                onChange={e => handleNameChange(index, e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder={`Guest ${index + 1} name`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="send-email"
            checked={sendEmail}
            onChange={e => setSendEmail(e.target.checked)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="send-email" className="text-sm text-gray-700">
            Send tickets via email
          </label>
        </div>

        {sendEmail && (
          <div>
            <label
              htmlFor="guest-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email (for all tickets)
            </label>
            <UserAutocomplete
              value={email}
              onChange={setEmail}
              onUserSelect={handleUserSelect}
              placeholder="Search existing user or enter new email"
            />
            <p className="mt-1 text-xs text-gray-500">
              Type to search existing users or enter a new email address
            </p>
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
            disabled={isSubmitting || !allNamesValid || (sendEmail && !email)}
            variant="primary"
            size="sm"
          >
            {isSubmitting
              ? "Creating..."
              : `Create ${ticketCount} Guest Ticket${ticketCount > 1 ? "s" : ""}`}
          </ActionButton>
          <ActionButton
            type="button"
            onClick={() => setIsOpen(false)}
            variant="secondary"
            size="sm"
          >
            Cancel
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
