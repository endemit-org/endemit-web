"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  buildTestSlipXml,
  printerHomepage,
  printToEposPrinter,
  probeEposPrinter,
  type EposPrinterWarning,
} from "./eposBrowserPrint";

const PROBE_INTERVAL_MS = 30_000;

type Probe =
  | { kind: "checking" }
  | { kind: "online"; warning?: EposPrinterWarning }
  | { kind: "offline" };

interface Props {
  printerUrl: string;
}

/**
 * Printer row in the register sidebar: a live reachability dot (silent
 * status probe every 30s and on tab focus — green reachable, amber paper /
 * cover trouble, red unreachable or cert not trusted), the printer's address
 * as a link (staff open it to accept the self-signed TLS cert on a new
 * device) and a test-print button that reports connectivity failures inline.
 */
export function PosPrinterStatus({ printerUrl }: Props) {
  const t = useTranslations("pos.printer");
  const [state, setState] = useState<"idle" | "testing" | "ok" | "error">(
    "idle"
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [probe, setProbe] = useState<Probe>({ kind: "checking" });

  const homepage = printerHomepage(printerUrl);

  const runProbe = useCallback(async () => {
    const result = await probeEposPrinter(printerUrl);
    setProbe(
      result.reachable
        ? { kind: "online", warning: result.warning }
        : { kind: "offline" }
    );
  }, [printerUrl]);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (document.visibilityState === "visible" && !cancelled) runProbe();
    };
    tick();
    const interval = window.setInterval(tick, PROBE_INTERVAL_MS);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [runProbe]);

  const dotClass =
    probe.kind === "checking"
      ? "bg-gray-300 animate-pulse"
      : probe.kind === "offline"
        ? "bg-red-500"
        : probe.warning
          ? "bg-amber-400"
          : "bg-green-500";
  const dotTitle =
    probe.kind === "checking"
      ? t("statusChecking")
      : probe.kind === "offline"
        ? t("statusOffline")
        : probe.warning
          ? t(probe.warning)
          : t("statusOnline");

  const handleTest = async () => {
    setState("testing");
    setErrorDetail(null);
    const result = await printToEposPrinter(
      printerUrl,
      buildTestSlipXml(t("testSlip"))
    );
    if (result.success) {
      setState("ok");
    } else {
      setState("error");
      setErrorDetail(result.error ?? null);
    }
    runProbe();
  };

  return (
    <div className="px-4 py-2 border-b text-xs text-gray-600">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`}
            title={dotTitle}
            role="img"
            aria-label={dotTitle}
          />
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659"
            />
          </svg>
          <a
            href={homepage}
            target="_blank"
            rel="noopener"
            className="truncate underline text-blue-600 hover:text-blue-800"
          >
            {homepage.replace(/^https?:\/\//, "")}
          </a>
        </span>
        <button
          onClick={handleTest}
          disabled={state === "testing"}
          className={`shrink-0 px-2 py-1 rounded border font-medium disabled:opacity-60 ${
            state === "ok"
              ? "border-green-300 text-green-700 bg-green-50"
              : state === "error"
                ? "border-red-300 text-red-700 bg-red-50"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {state === "testing"
            ? t("testing")
            : state === "ok"
              ? t("testOk")
              : state === "error"
                ? t("testFailed")
                : t("test")}
        </button>
      </div>
      {probe.kind === "online" && probe.warning && (
        <p className="mt-1 text-amber-700">{t(probe.warning)}</p>
      )}
      {(state === "error" ||
        (probe.kind === "offline" && state !== "testing")) && (
        <p className="mt-1 text-red-600">
          {errorDetail ? `${errorDetail} — ` : ""}
          {t("certHint")}
        </p>
      )}
    </div>
  );
}
