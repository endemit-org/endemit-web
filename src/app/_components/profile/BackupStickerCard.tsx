"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const LinkStickerModal = dynamic(
  () => import("@/app/_components/profile/LinkStickerModal"),
  { ssr: false }
);

interface Props {
  currentCode: string | null;
  claimedAt: string | null;
}

export default function BackupStickerCard({ currentCode, claimedAt }: Props) {
  const router = useRouter();
  const [isLinking, setIsLinking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUnlink = useCallback(async () => {
    if (!confirm("Unlink this backup sticker?")) return;
    setIsLinking(true);
    try {
      const response = await fetch("/api/v1/wallet/sticker", {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unlink sticker");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unlink sticker");
    } finally {
      setIsLinking(false);
    }
  }, [router]);

  return (
    <div className="bg-neutral-900 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold text-neutral-200 mb-1">
        Backup Sticker
      </h3>
      <p className="text-sm text-neutral-400 mb-4">
        Link a pre-printed sticker to your account so you can still pay at POS
        registers if your phone dies.
      </p>

      {currentCode ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-mono font-bold tracking-[0.3em] text-neutral-200">
              {currentCode}
            </p>
            {claimedAt && (
              <p className="text-xs text-neutral-500 mt-1">
                Linked on {new Date(claimedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={handleUnlink}
            disabled={isLinking}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLinking ? "Unlinking..." : "Unlink"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Link a sticker
        </button>
      )}

      <LinkStickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
