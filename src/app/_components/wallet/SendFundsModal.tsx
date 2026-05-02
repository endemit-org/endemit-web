"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TOKEN_CONFIG, formatTokensFromCents } from "@/lib/util/currency";
import WalletAnimationRenderer from "@/app/_components/wallet/WalletAnimationRenderer";
import { useWalletAnimation } from "@/app/_components/wallet/WalletCoinAnimation";

interface Recipient {
  userId: string;
  username: string;
  name: string | null;
  image: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  senderBalance: number;
}

type Mode = "scan" | "confirm" | "success" | "error";

const STICKER_PATTERN = /^[A-Z]{2}[0-9]{2}$/;

export default function SendFundsModal({
  isOpen,
  onClose,
  senderBalance,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scan");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [note, setNote] = useState("");
  const [sentAmount, setSentAmount] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const noteId = useId();
  const successIconRef = useRef<HTMLDivElement>(null);
  const successAnim = useWalletAnimation();
  const triggerSuccessAnimation = successAnim.triggerAnimation;
  const hasTriggeredCoinsRef = useRef(false);

  useEffect(() => {
    if (mode !== "success" || hasTriggeredCoinsRef.current) return;
    hasTriggeredCoinsRef.current = true;
    const timer = setTimeout(() => {
      triggerSuccessAnimation("out", successIconRef.current);
    }, 80);
    return () => clearTimeout(timer);
  }, [mode, triggerSuccessAnimation]);

  const reset = useCallback(() => {
    setMode("scan");
    setRecipient(null);
    setIsResolving(false);
    setIsSending(false);
    setError(null);
    setAmountInput("");
    setNote("");
    setSentAmount(0);
    setIdempotencyKey(null);
    setManualInput("");
    hasTriggeredCoinsRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    if (isSending) return;
    reset();
    onClose();
  }, [isSending, onClose, reset]);

  const resolveValue = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isResolving) return;

    setIsResolving(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/wallet/transfer/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not resolve recipient");
      }
      setRecipient(data);
      setIdempotencyKey(crypto.randomUUID());
      setMode("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setIsResolving(false);
    }
  }, [isResolving]);

  const handleQrScan = useCallback(
    (result: { rawValue: string }[]) => {
      if (result && result.length > 0 && mode === "scan" && !isResolving) {
        const value = result[0].rawValue;
        if (value) resolveValue(value);
      }
    },
    [mode, isResolving, resolveValue]
  );

  const amountCents = useMemo(() => {
    if (!amountInput) return 0;
    const parsed = parseFloat(amountInput.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [amountInput]);

  const exceedsBalance = amountCents > senderBalance;
  const balanceAfter = senderBalance - amountCents;

  const handleSend = useCallback(async () => {
    if (!recipient || !idempotencyKey || isSending || amountCents <= 0) return;

    setIsSending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/wallet/transfer/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUserId: recipient.userId,
          amount: amountCents,
          idempotencyKey,
          note: note.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send");
      }
      setSentAmount(amountCents);
      setMode("success");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setIsSending(false);
    }
  }, [recipient, idempotencyKey, isSending, amountCents, note]);

  if (!isOpen) return null;

  const recipientLabel = recipient
    ? recipient.name || recipient.username
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={handleClose}
    >
      <div
        className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-700 relative"
        onClick={e => e.stopPropagation()}
      >
        {(isResolving || isSending) && (
          <div className="absolute inset-0 z-10 bg-neutral-900/95 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-medium">
              {isResolving ? "Resolving..." : "Sending..."}
            </p>
          </div>
        )}

        <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {mode === "scan" && "Send funds"}
              {mode === "confirm" && "Confirm transfer"}
              {mode === "success" && "Sent"}
              {mode === "error" && "Error"}
            </h2>
            {mode !== "success" && (
              <p className="text-xs text-neutral-500 mt-0.5">
                Balance:{" "}
                <span className="text-neutral-300">
                  {formatTokensFromCents(senderBalance)}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isSending}
            className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 disabled:opacity-50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        <div className="p-6">
          {mode === "scan" && (
            <div>
              <p className="text-neutral-300 mb-4 text-sm text-center">
                Scan the recipient&apos;s QR code, or paste their sticker /
                receive code below.
              </p>
              <div className="rounded-lg overflow-hidden mb-3 bg-black">
                <Scanner
                  onScan={handleQrScan}
                  onError={err => console.error(err)}
                  components={{ finder: true, torch: true }}
                  styles={{ container: { width: "100%" } }}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="AB12 or ndr1.…"
                  value={manualInput}
                  disabled={isResolving}
                  onChange={e => {
                    const v = e.target.value;
                    setManualInput(
                      STICKER_PATTERN.test(v.trim().toUpperCase()) ||
                        v.length <= 4
                        ? v.toUpperCase()
                        : v
                    );
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && manualInput.trim()) {
                      resolveValue(manualInput);
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm font-mono disabled:opacity-50 placeholder-neutral-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => resolveValue(manualInput)}
                  disabled={!manualInput.trim() || isResolving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg"
                >
                  Resolve
                </button>
              </div>
              {error && (
                <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
              )}
            </div>
          )}

          {mode === "confirm" && recipient && (
            <div>
              <div className="flex items-center gap-3 bg-neutral-800/60 rounded-lg p-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {recipient.image ? (
                    <Image
                      src={recipient.image}
                      alt={recipientLabel}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {recipientLabel
                        .split(" ")
                        .map(n => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-neutral-500">
                    Sending to
                  </p>
                  <p className="text-white font-medium truncate">
                    {recipientLabel}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    @{recipient.username}
                  </p>
                </div>
              </div>

              <div className="flex items-baseline justify-between mb-1">
                <label className="block text-sm text-neutral-300">Amount</label>
                <span className="text-xs text-neutral-500">
                  Balance: {formatTokensFromCents(senderBalance)}
                </span>
              </div>
              <div className="relative mb-1">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  autoFocus
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  className={`w-full pl-4 pr-14 py-3 bg-neutral-800 border rounded-lg text-white text-2xl font-semibold focus:outline-none ${
                    exceedsBalance
                      ? "border-red-700 focus:border-red-500"
                      : "border-neutral-700 focus:border-blue-500"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">
                  {TOKEN_CONFIG.symbol}
                </span>
              </div>
              <p
                className={`text-xs mb-4 ${
                  exceedsBalance ? "text-red-400" : "text-neutral-500"
                }`}
              >
                {exceedsBalance
                  ? "Amount exceeds your balance"
                  : amountCents > 0
                    ? `After: ${formatTokensFromCents(balanceAfter)}`
                    : `Available: ${formatTokensFromCents(senderBalance)}`}
              </p>

              <label
                htmlFor={noteId}
                className="block text-sm text-neutral-300 mb-1"
              >
                Note (optional)
              </label>
              <input
                id={noteId}
                type="text"
                maxLength={120}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What's it for?"
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm mb-4 focus:outline-none focus:border-blue-500"
              />

              {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={amountCents <= 0 || exceedsBalance || isSending}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {amountCents <= 0
                  ? "Enter an amount"
                  : exceedsBalance
                    ? "Insufficient balance"
                    : `Send ${formatTokensFromCents(amountCents)}`}
              </button>

              <button
                onClick={() => {
                  setRecipient(null);
                  setIdempotencyKey(null);
                  setAmountInput("");
                  setNote("");
                  setError(null);
                  setMode("scan");
                }}
                className="w-full mt-2 text-sm text-neutral-500 hover:text-neutral-300 py-2"
              >
                ← Scan a different code
              </button>
            </div>
          )}

          {mode === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4">
                <WalletAnimationRenderer
                  animations={successAnim.animations}
                  showGlow={successAnim.showGlow}
                  glowDirection={successAnim.glowDirection}
                  onAnimationComplete={successAnim.removeAnimation}
                >
                  <div
                    ref={successIconRef}
                    className="w-20 h-20 rounded-full bg-green-900/50 flex items-center justify-center"
                  >
                    <svg
                      className="w-10 h-10 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </WalletAnimationRenderer>
              </div>
              <h3 className="text-xl font-semibold text-green-400">
                Sent {formatTokensFromCents(sentAmount)}
              </h3>
              <p className="text-neutral-400 mt-2">
                {recipientLabel
                  ? `to ${recipientLabel}`
                  : "Transfer complete"}
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
