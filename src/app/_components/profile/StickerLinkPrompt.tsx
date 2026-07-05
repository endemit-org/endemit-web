"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Props {
  paymentCode: string;
}

type PreviewStatus =
  | { status: "would_link"; code: string }
  | { status: "already_yours"; code: string }
  | { status: "conflict_other"; code: string }
  | { status: "swap_required"; code: string; existingCode: string };

type UiState =
  | { kind: "loading" }
  | { kind: "preview"; preview: PreviewStatus }
  | { kind: "linking" }
  | { kind: "linked"; code: string }
  | { kind: "error"; message: string };

export default function StickerLinkPrompt({ paymentCode }: Props) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [state, setState] = useState<UiState>({ kind: "loading" });

  // Strip ?paymentCode= from the URL without a navigation/scroll.
  const dismiss = useCallback(() => {
    router.replace("/profile", { scroll: false });
  }, [router]);

  // Fetch preview on mount. For already_yours, dismiss silently.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/v1/wallet/sticker/preview?code=${encodeURIComponent(paymentCode)}`,
          { method: "GET" }
        );
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setState({
            kind: "error",
            message: data?.error || t("wristband.couldNotCheck"),
          });
          return;
        }

        if (data.status === "already_yours") {
          dismiss();
          return;
        }

        setState({ kind: "preview", preview: data });
      } catch {
        if (!cancelled) {
          setState({ kind: "error", message: t("wristband.networkError") });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentCode, dismiss, t]);

  const confirmLink = useCallback(async () => {
    setState({ kind: "linking" });
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
      if (data.status === "linked") {
        setState({ kind: "linked", code: data.code });
        router.refresh();
        return;
      }
      if (data.status === "already_yours") {
        dismiss();
        return;
      }
      if (data.status === "conflict_other") {
        setState({
          kind: "preview",
          preview: { status: "conflict_other", code: data.code },
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
          },
        });
        return;
      }
      setState({ kind: "error", message: t("wristband.unexpectedResponse") });
    } catch {
      setState({ kind: "error", message: t("wristband.networkError") });
    }
  }, [paymentCode, router, dismiss, t]);

  if (state.kind === "loading") {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-6 text-neutral-400 text-sm">
        {t("wristband.checking")}
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="bg-red-950/40 border border-red-900/60 rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
        <p className="text-red-300 text-sm">{state.message}</p>
        <button
          onClick={dismiss}
          className="px-3 py-1.5 text-sm text-red-200 hover:text-white border border-red-900/60 rounded"
        >
          {t("wristband.dismiss")}
        </button>
      </div>
    );
  }

  if (state.kind === "linking") {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-6 text-neutral-300 text-sm">
        {t("wristband.linking")}
      </div>
    );
  }

  if (state.kind === "linked") {
    return (
      <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-emerald-200 font-semibold">
            {t("wristband.linkedTitle", { code: state.code })}
          </p>
          <p className="text-emerald-300/80 text-sm mt-1">
            {t("wristband.linkedDesc")}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="px-3 py-1.5 text-sm text-emerald-200 hover:text-white border border-emerald-900/60 rounded"
        >
          {t("wristband.done")}
        </button>
      </div>
    );
  }

  const preview = state.preview;

  if (preview.status === "would_link") {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-6">
        <p className="text-neutral-200 font-semibold mb-1">
          {t("wristband.wouldLinkTitle", { code: preview.code })}
        </p>
        <p className="text-neutral-400 text-sm mb-4">
          {t("wristband.wouldLinkDesc")}
        </p>
        <div className="flex gap-3">
          <button
            onClick={confirmLink}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            {t("wristband.linkButton")}
          </button>
          <button
            onClick={dismiss}
            className="px-4 py-2 text-sm text-neutral-300 hover:text-white border border-neutral-700 rounded-lg"
          >
            {t("wristband.cancel")}
          </button>
        </div>
      </div>
    );
  }

  if (preview.status === "conflict_other") {
    return (
      <div className="bg-red-950/40 border border-red-900/60 rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-red-200 font-semibold">
            {t("wristband.conflictTitle", { code: preview.code })}
          </p>
          <p className="text-red-300/80 text-sm mt-1">
            {t("wristband.conflictDesc")}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="px-3 py-1.5 text-sm text-red-200 hover:text-white border border-red-900/60 rounded"
        >
          {t("wristband.dismiss")}
        </button>
      </div>
    );
  }

  if (preview.status !== "swap_required") return null;

  return (
    <div className="bg-amber-950/40 border border-amber-900/60 rounded-lg p-4 mb-6">
      <p className="text-amber-200 font-semibold">
        {t("wristband.swapTitle", { existingCode: preview.existingCode })}
      </p>
      <p className="text-amber-300/80 text-sm mt-1 mb-3">
        {t.rich("wristband.swapDesc", {
          code: preview.code,
          editLink: (chunks: ReactNode) => (
            <Link href={"/profile/edit"}>{chunks}</Link>
          ),
        })}
      </p>
      <button
        onClick={dismiss}
        className="px-3 py-1.5 text-sm text-amber-200 hover:text-white border border-amber-900/60 rounded"
      >
        {t("wristband.gotIt")}
      </button>
    </div>
  );
}
