"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TOKEN_CONFIG, formatTokensFromCents } from "@/lib/util/currency";
import WalletAnimationRenderer from "@/app/_components/wallet/WalletAnimationRenderer";
import { useWalletAnimation } from "@/app/_components/wallet/WalletCoinAnimation";
import { useTranslations } from "next-intl";

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
  initialCode?: string;
  /** Skip scanning entirely — open on the confirm step for this recipient. */
  initialRecipient?: Recipient | null;
}

type Mode = "scan" | "confirm" | "success" | "error";

export default function SendFundsModal({
  isOpen,
  onClose,
  senderBalance,
  initialCode,
  initialRecipient,
}: Props) {
  const t = useTranslations("profile.wallet.send");
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
    hasTriggeredCoinsRef.current = false;
    initialCodeHandledRef.current = false;
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

  // Known recipient (friends list, transaction detail) — no resolve needed.
  const selectRecipient = useCallback((r: Recipient) => {
    setRecipient(r);
    setIdempotencyKey(crypto.randomUUID());
    setError(null);
    setMode("confirm");
  }, []);

  // Pre-resolve the recipient when opened from a shared receive link.
  const initialCodeHandledRef = useRef(false);
  useEffect(() => {
    if (!isOpen || initialCodeHandledRef.current) return;
    if (!initialCode && !initialRecipient) return;
    initialCodeHandledRef.current = true;
    if (initialRecipient) {
      selectRecipient(initialRecipient);
    } else if (initialCode) {
      resolveValue(initialCode);
    }
  }, [isOpen, initialCode, initialRecipient, resolveValue, selectRecipient]);

  // Recent transfer counterparties — quick-pick so repeat sends skip the scan.
  const [friends, setFriends] = useState<Recipient[] | null>(null);
  useEffect(() => {
    if (!isOpen || friends !== null) return;
    let cancelled = false;
    fetch("/api/v1/wallet/transfer/friends")
      .then(res => (res.ok ? res.json() : { friends: [] }))
      .then(data => {
        if (!cancelled) setFriends(data.friends ?? []);
      })
      .catch(() => {
        if (!cancelled) setFriends([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, friends]);

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
  }, [recipient, idempotencyKey, isSending, amountCents, note, router]);

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
              {isResolving ? t("resolving") : t("sending")}
            </p>
          </div>
        )}

        <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {mode === "scan" && t("titleScan")}
              {mode === "confirm" && t("titleConfirm")}
              {mode === "success" && t("titleSuccess")}
              {mode === "error" && t("titleError")}
            </h2>
            {mode !== "success" && (
              <p className="text-xs text-neutral-500 mt-0.5">
                {t("balance", {
                  amount: formatTokensFromCents(senderBalance),
                })}
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
                {t("scanHint")}
              </p>
              <div className="rounded-lg overflow-hidden mb-3 bg-black">
                <Scanner
                  onScan={handleQrScan}
                  onError={err => console.error(err)}
                  components={{ finder: true, torch: true }}
                  styles={{ container: { width: "100%" } }}
                />
              </div>
              {error && (
                <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
              )}

              {friends && friends.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
                    {t("friends")}
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {friends.map(friend => {
                      const label = friend.name || friend.username;
                      return (
                        <button
                          key={friend.userId}
                          type="button"
                          onClick={() => selectRecipient(friend)}
                          className="flex flex-col items-center gap-1 w-16 flex-shrink-0 group"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-500 transition-shadow">
                            {friend.image ? (
                              <Image
                                src={friend.image}
                                alt={label}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-white">
                                {label
                                  .split(" ")
                                  .map(n => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-400 group-hover:text-neutral-200 truncate w-full text-center">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
                    {t("sendingTo")}
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
                <label className="block text-sm text-neutral-300">{t("amount")}</label>
                <span className="text-xs text-neutral-500">
                  {t("balance", {
                    amount: formatTokensFromCents(senderBalance),
                  })}
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
                  ? t("exceeds")
                  : amountCents > 0
                    ? t("after", {
                        amount: formatTokensFromCents(balanceAfter),
                      })
                    : t("available", {
                        amount: formatTokensFromCents(senderBalance),
                      })}
              </p>

              <label
                htmlFor={noteId}
                className="block text-sm text-neutral-300 mb-1"
              >
                {t("noteLabel")}
              </label>
              <input
                id={noteId}
                type="text"
                maxLength={120}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t("notePlaceholder")}
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
                  ? t("enterAmount")
                  : exceedsBalance
                    ? t("insufficient")
                    : t("sendAmount", {
                        amount: formatTokensFromCents(amountCents),
                      })}
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
                {t("scanDifferent")}
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
                {t("sentAmount", { amount: formatTokensFromCents(sentAmount) })}
              </h3>
              <p className="text-neutral-400 mt-2">
                {recipientLabel
                  ? t("toName", { name: recipientLabel })
                  : t("complete")}
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg"
              >
                {t("done")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
