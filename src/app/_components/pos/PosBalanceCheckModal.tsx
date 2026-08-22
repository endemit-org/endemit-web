"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Scanner } from "@yudiel/react-qr-scanner";
import ModalPortal from "@/app/_components/ui/ModalPortal";
import { formatTokensFromCents } from "@/lib/util/currency";
import ClientDate from "@/app/_components/ui/ClientDate";

interface BalanceCheckResult {
  customer: { id: string; name: string | null };
  balance: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    note: string | null;
    createdAt: string;
  }>;
}

interface Props {
  onClose: () => void;
  /** Attach the scanned wallet to the next order (wallet-accepting registers). */
  onUseForOrder?: (customer: {
    id: string;
    name: string | null;
    balance: number;
  }) => void;
}

export function PosBalanceCheckModal({ onClose, onUseForOrder }: Props) {
  const t = useTranslations("pos.balanceCheck");
  const [result, setResult] = useState<BalanceCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRotated, setIsRotated] = useState(true);

  const submitCode = useCallback(
    async (rawCode: string) => {
      // Raw value goes to the server as-is — receive codes are
      // case-sensitive HMACs, wristband codes get resolved there too.
      const code = rawCode.trim();
      if (!code || isChecking) return;

      setIsChecking(true);
      setError(null);

      try {
        const response = await fetch("/api/v1/pos/balance-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || t("checkFailed"));
        }
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("checkFailed"));
      } finally {
        setIsChecking(false);
      }
    },
    [isChecking, t]
  );

  const handleQrScan = useCallback(
    (scanned: { rawValue: string }[]) => {
      if (scanned && scanned.length > 0 && !result && !isChecking) {
        submitCode(scanned[0].rawValue);
      }
    },
    [submitCode, result, isChecking]
  );

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80">
        <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-700 relative">
          {isChecking && (
            <div className="absolute inset-0 z-10 bg-neutral-900/95 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white font-medium">{t("checking")}</p>
            </div>
          )}

          <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {t("title")}
              {result && (
                <span className="ml-2 text-emerald-400">
                  {formatTokensFromCents(result.balance)}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1">
            {result && (
              <button
                onClick={() => setIsRotated(r => !r)}
                className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400"
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
                    d="M4 4v5h5M20 20v-5h-5M4 20a9 9 0 0015-6.7M20 4a9 9 0 00-15 6.7"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400"
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
          </div>

          <div className="p-6">
            {!result ? (
              <div className="text-center">
                <p className="text-neutral-300 mb-4">{t("pointCamera")}</p>
                <div className="relative rounded-lg overflow-hidden mb-2 bg-black">
                  <Scanner
                    onScan={handleQrScan}
                    onError={err => console.error(err)}
                    components={{
                      finder: true,
                      torch: true,
                    }}
                    styles={{
                      container: {
                        width: "100%",
                      },
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 px-3 pt-8 pb-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-center pointer-events-none">
                    <input
                      type="text"
                      placeholder="AB12"
                      maxLength={4}
                      disabled={isChecking}
                      className="pointer-events-auto w-36 px-3 py-2 bg-black/70 backdrop-blur border border-white/30 rounded-lg text-white text-center text-xl font-mono uppercase disabled:opacity-50 placeholder-white/30 focus:outline-none focus:border-white/60"
                      style={{ letterSpacing: "0.3em" }}
                      onChange={e => {
                        const value = e.target.value.toUpperCase();
                        e.target.value = value;
                        if (
                          value.length === 4 &&
                          /^[A-Z]{2}[0-9]{2}$/.test(value)
                        ) {
                          submitCode(value);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          submitCode((e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                  </div>
                </div>
                {error && (
                  <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mt-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={isRotated ? { transform: "rotate(180deg)" } : undefined}>
                <div className="text-center mb-4">
                  <p className="text-neutral-400 text-sm">
                    {result.customer.name || t("unknownCustomer")}
                  </p>
                  <div
                    className={`text-5xl font-bold mt-1 ${
                      result.balance > 0
                        ? "text-green-400"
                        : result.balance < 0
                          ? "text-red-400"
                          : "text-neutral-300"
                    }`}
                  >
                    {formatTokensFromCents(result.balance)}
                  </div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">
                    {t("balanceLabel")}
                  </p>
                </div>

                <h3 className="text-sm font-medium text-neutral-400 mb-2">
                  {t("lastTransactions")}
                </h3>
                {result.transactions.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    {t("noTransactions")}
                  </p>
                ) : (
                  <div className="bg-neutral-800/50 rounded-lg divide-y divide-neutral-700/50 mb-4">
                    {result.transactions.map(tx => (
                      <div
                        key={tx.id}
                        className="px-4 py-2.5 flex items-center justify-between text-sm"
                      >
                        <div className="min-w-0">
                          <div className="text-neutral-300">{tx.type}</div>
                          <div className="text-xs text-neutral-500 truncate">
                            <ClientDate date={tx.createdAt} />
                            {tx.note ? ` · ${tx.note}` : ""}
                          </div>
                        </div>
                        <span
                          className={`font-medium whitespace-nowrap ml-3 ${
                            tx.amount >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {formatTokensFromCents(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                </div>
                {onUseForOrder && (
                  <button
                    onClick={() => {
                      onUseForOrder({
                        id: result.customer.id,
                        name: result.customer.name,
                        balance: result.balance,
                      });
                      onClose();
                    }}
                    className="w-full px-4 py-3 mb-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                  >
                    {t("useForOrder")}
                  </button>
                )}
                <button
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                  className="w-full px-4 py-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
                >
                  {t("scanAnother")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
