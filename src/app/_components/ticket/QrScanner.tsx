"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { scanTicketAtEventAction } from "@/domain/ticket/actions/scanTicketAtEventAction";
import ActionButton from "@/app/_components/form/ActionButton";
import AnimatedSuccessIcon from "@/app/_components/icon/AnimatedSuccessIcon";
import { formatDecimalPrice } from "@/lib/util/formatting";
import { playBeep, playBlorp } from "@/domain/ticket/util";
import { useTranslations } from "next-intl";

type ScanResponse = Awaited<ReturnType<typeof scanTicketAtEventAction>>;
type TicketInfo = NonNullable<ScanResponse["ticket"]>;
type ScanInput = { code: string } | { shortId: string };

type ResultTone = "success" | "warning" | "error";

interface ScanOutcome {
  tone: ResultTone;
  message: string;
  ticket: TicketInfo | null;
}

type Props = {
  eventId: string;
  initialScanned: number;
  initialSold: number;
};

// Compact ticket code: E2.<shortId>.<mac>. Anything else is not our ticket,
// so it is rejected without a server round trip.
const TICKET_CODE_PATTERN = /^E2\.[A-Z0-9]{1,12}\.[A-Z2-7]{16}$/i;

// A valid ticket clears itself; anything else waits for a tap so a rejection
// can't be missed.
const SUCCESS_DISMISS_MS = 1200;

// The phone that was just scanned usually stays in view for a moment. Without
// this it would be read again and reported as "already scanned".
const SAME_CODE_IGNORE_MS = 10_000;

// Continuous autofocus where the browser exposes it (Chrome on Android);
// ignored elsewhere. The rest mirrors the scanner's default constraints.
const CAMERA_CONSTRAINTS = {
  facingMode: "environment",
  width: { min: 640, ideal: 720, max: 1920 },
  height: { min: 640, ideal: 720, max: 1080 },
  advanced: [{ focusMode: "continuous" }],
} as unknown as MediaTrackConstraints;

const TONE_STYLES: Record<ResultTone, { card: string; flash: string }> = {
  success: { card: "bg-green-600", flash: "#16a34a" },
  warning: { card: "bg-amber-500", flash: "#f59e0b" },
  error: { card: "bg-red-600", flash: "#dc2626" },
};

export default function QRScanner({
  eventId,
  initialScanned,
  initialSold,
}: Props) {
  const t = useTranslations("scan");
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [counter, setCounter] = useState({
    scanned: initialScanned,
    sold: initialSold,
  });
  const [manualCode, setManualCode] = useState("");
  const [hasCameraError, setHasCameraError] = useState(false);

  // Guards live in refs: the scanner keeps decoding frames while a result is
  // on screen, and those callbacks must see the current value immediately.
  const isBusyRef = useRef(false);
  const lastCodeRef = useRef<{ raw: string; at: number } | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const clearDismissTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const dismissOutcome = useCallback(() => {
    clearDismissTimer();
    setOutcome(null);
    setIsChecking(false);
    isBusyRef.current = false;
  }, []);

  useEffect(() => clearDismissTimer, []);

  const showOutcome = useCallback(
    (next: ScanOutcome) => {
      setIsChecking(false);
      setOutcome(next);

      if (next.tone === "success") {
        playBeep();
        navigator.vibrate?.(80);
        dismissTimerRef.current = setTimeout(
          dismissOutcome,
          SUCCESS_DISMISS_MS
        );
      } else {
        playBlorp();
        navigator.vibrate?.([200, 80, 200]);
      }

      // Whole-screen colour pulse: readable from the corner of the eye.
      const flash = flashRef.current;
      if (flash) {
        flash.style.backgroundColor = TONE_STYLES[next.tone].flash;
        flash.animate([{ opacity: 0.85 }, { opacity: 0 }], {
          duration: next.tone === "success" ? 450 : 700,
          easing: "ease-out",
        });
      }
    },
    [dismissOutcome]
  );

  const failureMessage = useCallback(
    (reason: Exclude<ScanResponse, { success: true }>["reason"]) => {
      switch (reason) {
        case "already_scanned":
          return t("result.alreadyScanned");
        case "wrong_event":
          return t("result.wrongEvent");
        case "invalid_code":
          return t("result.invalidCode");
        case "not_found":
          return t("result.notFound");
        case "refunded":
          return t("result.refunded");
        case "cancelled":
          return t("result.cancelled");
        default:
          return t("result.genericError");
      }
    },
    [t]
  );

  const submitScan = useCallback(
    async (input: ScanInput) => {
      isBusyRef.current = true;
      setIsChecking(true);

      try {
        const response = await scanTicketAtEventAction({ eventId, ...input });

        if (response.success) {
          setCounter({
            scanned: response.summary.ticketsScanned,
            sold: response.summary.ticketsSold,
          });
          showOutcome({
            tone: "success",
            message: t("result.validTicket"),
            ticket: response.ticket,
          });
          return;
        }

        showOutcome({
          tone: response.reason === "already_scanned" ? "warning" : "error",
          message: failureMessage(response.reason),
          ticket: response.ticket,
        });
      } catch (error) {
        console.error(error);
        showOutcome({
          tone: "error",
          message: t("result.genericError"),
          ticket: null,
        });
      }
    },
    [eventId, failureMessage, showOutcome, t]
  );

  const handleScan = (detected: { rawValue: string }[]) => {
    if (isBusyRef.current) return;

    const raw = detected[0]?.rawValue?.trim();
    if (!raw) return;

    const last = lastCodeRef.current;
    const now = Date.now();
    if (last && last.raw === raw && now - last.at < SAME_CODE_IGNORE_MS) {
      return;
    }
    lastCodeRef.current = { raw, at: now };

    if (!TICKET_CODE_PATTERN.test(raw)) {
      isBusyRef.current = true;
      showOutcome({
        tone: "error",
        message: t("result.notATicket"),
        ticket: null,
      });
      return;
    }

    void submitScan({ code: raw });
  };

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();

    const shortId = manualCode.trim().toUpperCase();
    if (!shortId || isBusyRef.current) return;

    setManualCode("");
    void submitScan({ shortId });
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    dismissOutcome();
    lastCodeRef.current = null;
    setHasCameraError(false);
  };

  const renderOutcome = (current: ScanOutcome) => (
    <button
      type="button"
      onClick={dismissOutcome}
      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-white ${TONE_STYLES[current.tone].card}`}
    >
      <div className="flex items-center gap-4">
        {current.tone === "success" ? (
          <AnimatedSuccessIcon strokeWidth={7} />
        ) : (
          <span className="text-5xl leading-none" aria-hidden>
            {current.tone === "warning" ? "⚠" : "✗"}
          </span>
        )}
        {current.ticket && (
          <span className="text-6xl font-semibold tracking-widest">
            {current.ticket.shortId}
          </span>
        )}
      </div>

      <div className="text-2xl font-bold uppercase">
        {current.tone === "success"
          ? t("result.verified")
          : current.tone === "warning"
            ? t("result.warning")
            : t("result.invalid")}
      </div>
      <div className="text-lg">{current.message}</div>

      {current.ticket && (
        <div>
          {/* What this ticket admits, large enough to read at a glance. */}
          {current.ticket.doorLabel && (
            <div className="mb-3 inline-block rounded-md bg-white px-4 py-1 text-3xl font-black uppercase tracking-wide text-neutral-900">
              {current.ticket.doorLabel}
            </div>
          )}
          <div className="text-2xl font-bold">
            {current.ticket.ticketHolderName}
            {current.ticket.isGuestList && (
              <span className="ml-2 align-middle text-sm px-2 py-0.5 rounded-full bg-white/25">
                {t("result.guest")}
              </span>
            )}
          </div>
          {current.ticket.productName && (
            <div className="text-base font-medium">{current.ticket.productName}</div>
          )}
          <div className="text-sm opacity-90">
            {current.ticket.ticketPayerEmail} ·{" "}
            {formatDecimalPrice(current.ticket.price)}
          </div>
        </div>
      )}

      {current.tone !== "success" && (
        <div className="mt-2 px-4 py-2 rounded-full bg-white text-neutral-900 font-semibold">
          {t("scanner.tapToContinue")}
        </div>
      )}
    </button>
  );

  return (
    <div className="">
      <ActionButton onClick={() => (isOpen ? handleCloseModal() : setIsOpen(true))}>
        {isOpen ? t("scanner.closeScanner") : t("scanner.scanTicket")}
      </ActionButton>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="light-scheme bg-white rounded-lg w-full max-w-2xl max-h-[95dvh] overflow-auto text-neutral-900">
            <div className="p-4">
              <div className="flex justify-between items-center gap-3 mb-3">
                <h2 className="text-xl font-bold">{t("scanner.modalTitle")}</h2>
                <div className="ml-auto text-sm font-semibold tabular-nums px-3 py-1 rounded-full bg-neutral-100">
                  {t("scanner.counter", {
                    scanned: counter.scanned,
                    sold: counter.sold,
                  })}
                </div>
                <button
                  onClick={handleCloseModal}
                  aria-label={t("scanner.closeScanner")}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg
                    className="w-6 h-6"
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

              {/* The camera stays mounted between tickets: restarting the
                  stream costs a fresh focus and exposure hunt every time.
                  Results are drawn over it instead. */}
              <div className="relative rounded-lg overflow-hidden bg-neutral-900">
                <Scanner
                  onScan={handleScan}
                  onError={error => {
                    console.error(error);
                    setHasCameraError(true);
                  }}
                  constraints={CAMERA_CONSTRAINTS}
                  formats={["qr_code"]}
                  components={{
                    finder: true,
                    torch: true,
                    zoom: true,
                  }}
                  sound={false}
                />

                {isChecking && !outcome && (
                  <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 text-white">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>{t("scanner.checking")}</span>
                  </div>
                )}

                {outcome && renderOutcome(outcome)}
              </div>

              <div className="mt-3 text-center text-sm text-neutral-600">
                {hasCameraError
                  ? t("scanner.cameraError")
                  : t("scanner.pointCamera")}
              </div>

              <form
                onSubmit={handleManualSubmit}
                className="mt-4 pt-4 border-t border-neutral-200"
              >
                <label
                  htmlFor="manual-ticket-code"
                  className="block text-sm font-medium mb-2"
                >
                  {t("scanner.manualEntry")}
                </label>
                <div className="flex gap-2">
                  <input
                    id="manual-ticket-code"
                    value={manualCode}
                    onChange={event =>
                      setManualCode(
                        event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                      )
                    }
                    placeholder={t("scanner.manualPlaceholder")}
                    maxLength={12}
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-32 px-3 py-2 rounded border border-neutral-300 bg-white text-neutral-900 text-xl font-semibold tracking-widest uppercase"
                  />
                  <button
                    type="submit"
                    disabled={!manualCode || isChecking}
                    className="flex-1 px-4 py-2 rounded bg-neutral-900 text-white font-semibold disabled:opacity-40"
                  >
                    {t("scanner.manualSubmit")}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            ref={flashRef}
            aria-hidden
            className="fixed inset-0 z-[60] pointer-events-none opacity-0"
          />
        </div>
      )}
    </div>
  );
}
