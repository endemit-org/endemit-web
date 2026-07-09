"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { fetchMyWalletAction } from "@/domain/wallet/actions/fetchMyWalletAction";
import { formatTokensFromCents } from "@/lib/util/currency";
import { OPEN_TOP_UP_EVENT } from "./topUpEvent";
import type { SceneStatus, WristbandColor } from "./WristbandScene";

// three.js stage — client-only and heavy, so keep it out of the page bundle.
const WristbandScene = dynamic(() => import("./WristbandScene"), {
  ssr: false,
});

interface Props {
  paymentCode: string;
  /** Set when the user arrives from the signed-out intro flow — they already
      committed to linking there, so skip the confirm step and link directly.
      Conflict/swap outcomes still render their prompts. */
  autoLink?: boolean;
}

type PreviewStatus = {
  /** Wristband color from the DB — null cycles the band's palette. */
  property: WristbandColor | null;
} & (
  | { status: "would_link"; code: string }
  | { status: "already_yours"; code: string }
  | { status: "conflict_other"; code: string }
  | { status: "swap_required"; code: string; existingCode: string }
);

type UiState =
  | { kind: "loading" }
  | { kind: "preview"; preview: PreviewStatus }
  | { kind: "linking"; preview: PreviewStatus }
  | {
      kind: "linked";
      code: string;
      balance: number | null;
      property: WristbandColor | null;
    }
  | { kind: "error"; message: string };

const panelSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};

export default function StickerLinkPrompt({
  paymentCode,
  autoLink = false,
}: Props) {
  const t = useTranslations("profile");
  const router = useRouter();
  const reducedMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<UiState>({ kind: "loading" });
  const [open, setOpen] = useState(true);

  const isBusy = state.kind === "linking";

  // Center icon in the 3D band: check when this band is (or already was)
  // linked to this account, cross when it belongs to someone else.
  const previewStatus =
    state.kind === "preview" || state.kind === "linking"
      ? state.preview.status
      : null;
  const sceneStatus: SceneStatus =
    state.kind === "linked" || previewStatus === "already_yours"
      ? "success"
      : previewStatus === "conflict_other"
        ? "error"
        : "none";

  // Band color from the DB once we know which sticker this is; while loading
  // or on error the band cycles its palette.
  const sceneColor: WristbandColor | null =
    state.kind === "linked"
      ? state.property
      : state.kind === "preview" || state.kind === "linking"
        ? state.preview.property
        : null;

  // Wristband number floating in the band center once the code is resolved;
  // the status icon takes over the same spot on success/error.
  const sceneLabel: string | null =
    state.kind === "linked"
      ? state.code
      : state.kind === "preview" || state.kind === "linking"
        ? state.preview.code
        : null;

  // Play the exit animation first; strip ?paymentCode= once it finishes.
  const dismiss = useCallback(() => {
    setOpen(false);
  }, []);

  // "Top up now" closes this modal, then asks the sidebar to open its
  // TopUpModal (it owns the currency products) once the exit finishes.
  const openTopUpAfterCloseRef = useRef(false);
  const topUpNow = useCallback(() => {
    openTopUpAfterCloseRef.current = true;
    setOpen(false);
  }, []);

  const removeQueryParam = useCallback(() => {
    router.replace("/profile", { scroll: false });
    if (openTopUpAfterCloseRef.current) {
      openTopUpAfterCloseRef.current = false;
      window.dispatchEvent(new CustomEvent(OPEN_TOP_UP_EVENT));
    }
  }, [router]);

  // Lock page scroll while the modal is up.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss, isBusy]);

  // Fetch preview once per code. The ref guard matters: router.refresh()
  // after linking gives this effect new dep identities, and re-fetching then
  // would clobber the success screen. No cleanup "cancelled" flag on purpose —
  // under StrictMode's double-mount the ref stays set while the first run's
  // cleanup fires, so cancelling would drop the only fetch and leave the
  // modal stuck on the loading state. Applying results only while still
  // loading makes the late resolution safe instead.
  const previewFetchedRef = useRef(false);
  useEffect(() => {
    if (previewFetchedRef.current) return;
    previewFetchedRef.current = true;

    const applyIfStillLoading = (next: UiState) => {
      setState(current => (current.kind === "loading" ? next : current));
    };

    (async () => {
      try {
        const response = await fetch(
          `/api/v1/wallet/sticker/preview?code=${encodeURIComponent(paymentCode)}`,
          { method: "GET" }
        );
        const data = await response.json();

        if (!response.ok) {
          applyIfStillLoading({
            kind: "error",
            message: data?.error || t("wristband.couldNotCheck"),
          });
          return;
        }

        applyIfStillLoading({ kind: "preview", preview: data });
      } catch {
        applyIfStillLoading({
          kind: "error",
          message: t("wristband.networkError"),
        });
      }
    })();
  }, [paymentCode, t]);

  const confirmLink = useCallback(async () => {
    if (state.kind !== "preview") return;
    setState({ kind: "linking", preview: state.preview });
    try {
      const response = await fetch("/api/v1/wallet/sticker/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: paymentCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        setState({
          kind: "error",
          message: data?.error || t("wristband.linkFailed"),
        });
        return;
      }
      if (data.status === "linked" || data.status === "already_yours") {
        // Show success immediately; the balance fades in when it arrives.
        setState({
          kind: "linked",
          code: data.code,
          balance: null,
          property: state.preview.property,
        });
        router.refresh();
        fetchMyWalletAction()
          .then(wallet => {
            setState(current =>
              current.kind === "linked"
                ? { ...current, balance: wallet?.balance ?? null }
                : current
            );
          })
          .catch(() => {
            // Balance is a nice-to-have on this screen; linking already worked.
          });
        return;
      }
      if (data.status === "conflict_other") {
        setState({
          kind: "preview",
          preview: {
            status: "conflict_other",
            code: data.code,
            property: state.preview.property,
          },
        });
        return;
      }
      if (data.status === "swap_required") {
        setState({
          kind: "preview",
          preview: {
            status: "swap_required",
            code: data.code,
            existingCode: data.existingCode,
            property: state.preview.property,
          },
        });
        return;
      }
      setState({ kind: "error", message: t("wristband.unexpectedResponse") });
    } catch {
      setState({ kind: "error", message: t("wristband.networkError") });
    }
  }, [state, paymentCode, router, t]);

  // Arriving from the signed-out intro flow (?autoLink=1): the user already
  // committed to linking there, so once the preview confirms the band is
  // free, link it without asking again. Fires at most once — conflict/swap
  // responses from the link call fall back to their normal prompts.
  const autoLinkFiredRef = useRef(false);
  useEffect(() => {
    if (!autoLink || autoLinkFiredRef.current) return;
    if (state.kind === "preview" && state.preview.status === "would_link") {
      autoLinkFiredRef.current = true;
      confirmLink();
    }
  }, [autoLink, state, confirmLink]);

  return (
    <AnimatePresence onExitComplete={removeQueryParam}>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          onClick={() => !isBusy && dismiss()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.94, y: 24 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reducedMotion
                ? { opacity: 0, transition: { duration: 0.15 } }
                : {
                    opacity: 0,
                    scale: 0.96,
                    y: 12,
                    transition: { duration: 0.16, ease: "easeIn" },
                  }
            }
            transition={panelSpring}
            onClick={e => e.stopPropagation()}
          >
            {/* 3D stage */}
            <div className="relative h-48">
              {/* white pool of light under the band, kept off the model */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-16 opacity-80"
                style={{
                  background:
                    "radial-gradient(55% 90% at 50% 100%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 55%, transparent 80%)",
                }}
              />
              <WristbandScene
                reducedMotion={reducedMotion}
                status={sceneStatus}
                color={sceneColor}
                label={sceneLabel}
                className="absolute inset-0"
              />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-neutral-900 to-transparent" />
            </div>

            {/* state content, crossfaded */}
            <div className="px-6 pb-6 pt-1">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={contentKey(state)}
                  initial={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 8, filter: "blur(4px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -8, filter: "blur(4px)" }
                  }
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                >
                  <ModalContent
                    state={state}
                    onConfirm={confirmLink}
                    onDismiss={dismiss}
                    onTopUp={topUpNow}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Linking keeps the preview layout (button goes busy), so it shares a key —
// no crossfade between "preview" and "linking".
function contentKey(state: UiState): string {
  if (state.kind === "preview" || state.kind === "linking") {
    return `preview:${state.preview.status}`;
  }
  return state.kind;
}

function ModalContent({
  state,
  onConfirm,
  onDismiss,
  onTopUp,
}: {
  state: UiState;
  onConfirm: () => void;
  onDismiss: () => void;
  onTopUp: () => void;
}) {
  const t = useTranslations("profile");

  if (state.kind === "loading") {
    return (
      <div className="flex items-center justify-center gap-3 py-6 text-neutral-400 text-sm">
        <Spinner />
        {t("wristband.checking")}
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="text-center">
        <p className="text-red-300 text-sm mb-5">{state.message}</p>
        <SecondaryButton onClick={onDismiss} fullWidth>
          {t("wristband.dismiss")}
        </SecondaryButton>
      </div>
    );
  }

  if (state.kind === "linked") {
    return (
      <div className="text-center">
        <p className="text-white text-lg font-semibold mb-3">
          {t("wristband.linkedTitle", { code: state.code })}
        </p>
        <div className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl px-4 py-3 mb-3">
          <p className="text-neutral-400 text-xs uppercase tracking-wide mb-0.5">
            {t("wristband.balanceLabel")}
          </p>
          <AnimatePresence mode="wait" initial={false}>
            {state.balance !== null ? (
              <motion.p
                key="balance"
                className="text-white text-2xl font-semibold tabular-nums"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {formatTokensFromCents(state.balance)}
              </motion.p>
            ) : (
              <motion.p
                key="loading"
                className="text-neutral-500 text-2xl font-semibold"
                exit={{ opacity: 0 }}
              >
                …
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <p className="text-neutral-400 text-sm mb-5">
          {t("wristband.topUpNow")}
        </p>
        <PrimaryButton onClick={onTopUp} fullWidth>
          {t("wristband.topUpOptionCard")}
        </PrimaryButton>
        <button
          onClick={onDismiss}
          className="mt-3 w-full text-center text-sm text-neutral-400 hover:text-neutral-200 underline underline-offset-4 decoration-neutral-600 hover:decoration-neutral-400 py-1 transition-colors"
        >
          {t("wristband.topUpOptionCash")}
        </button>
      </div>
    );
  }

  const preview = state.preview;
  const busy = state.kind === "linking";

  if (preview.status === "already_yours") {
    return (
      <div className="text-center">
        <p className="text-white text-lg font-semibold mb-1">
          {t("wristband.alreadyLinkedTitle", { code: preview.code })}
        </p>
        <p className="text-neutral-400 text-sm mb-5">
          {t("wristband.alreadyLinkedDesc")}
        </p>
        <PrimaryButton onClick={onDismiss} fullWidth>
          {t("wristband.done")}
        </PrimaryButton>
      </div>
    );
  }

  if (preview.status === "would_link") {
    return (
      <div className="text-center">
        <p className="text-white text-lg font-semibold mb-1">
          {t("wristband.wouldLinkTitle", { code: preview.code })}
        </p>
        <p className="text-neutral-400 text-sm mb-5">
          {t("wristband.wouldLinkDesc")}
        </p>
        <div className="flex flex-col gap-2">
          <PrimaryButton onClick={onConfirm} disabled={busy} fullWidth>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                {t("wristband.linking")}
              </span>
            ) : (
              t("wristband.linkButton")
            )}
          </PrimaryButton>
          <SecondaryButton onClick={onDismiss} disabled={busy} fullWidth>
            {t("wristband.cancel")}
          </SecondaryButton>
        </div>
      </div>
    );
  }

  if (preview.status === "conflict_other") {
    return (
      <div className="text-center">
        <p className="text-red-200 font-semibold mb-1">
          {t("wristband.conflictTitle", { code: preview.code })}
        </p>
        <p className="text-red-300/80 text-sm mb-5">
          {t("wristband.conflictDesc")}
        </p>
        <SecondaryButton onClick={onDismiss} fullWidth>
          {t("wristband.dismiss")}
        </SecondaryButton>
      </div>
    );
  }

  if (preview.status !== "swap_required") return null;

  return (
    <div className="text-center">
      <p className="text-amber-200 font-semibold mb-1">
        {t("wristband.swapTitle", { existingCode: preview.existingCode })}
      </p>
      <p className="text-amber-300/80 text-sm mb-5">
        {t.rich("wristband.swapDesc", {
          code: preview.code,
          editLink: (chunks: ReactNode) => (
            <Link href={"/profile/edit"} className="underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <SecondaryButton onClick={onDismiss} fullWidth>
        {t("wristband.gotIt")}
      </SecondaryButton>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
    />
  );
}

function PrimaryButton({
  fullWidth,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { fullWidth?: boolean }) {
  return (
    <button
      {...props}
      className={`px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors active:scale-[0.98] ${
        fullWidth ? "w-full" : ""
      } ${className ?? ""}`}
    />
  );
}

function SecondaryButton({
  fullWidth,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { fullWidth?: boolean }) {
  return (
    <button
      {...props}
      className={`px-4 py-2.5 text-sm text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 disabled:opacity-60 rounded-xl transition-colors active:scale-[0.98] ${
        fullWidth ? "w-full" : ""
      } ${className ?? ""}`}
    />
  );
}
