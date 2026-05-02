"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

const LinkStickerModal = dynamic(
  () => import("@/app/_components/profile/LinkStickerModal"),
  { ssr: false }
);

interface Props {
  currentCode: string | null;
}

const INFO_TEXT =
  "A backup sticker links a printed QR code to your account. If your phone runs out of battery, you can still pay at POS registers — the seller scans the sticker (or types its 4-char code) to charge your wallet.";

function InfoButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="What is a backup sticker?"
      aria-expanded={isOpen}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="flex-shrink-0 w-5 h-5 rounded-full border border-neutral-700 text-neutral-500 hover:text-neutral-200 hover:border-neutral-500 flex items-center justify-center text-xs transition-colors"
    >
      ?
    </button>
  );
}

export default function BackupStickerInline({ currentCode }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const toggleInfo = () => setIsInfoOpen(v => !v);

  return (
    <div className="mb-6">
      <div className="flex items-stretch gap-2">
        {currentCode ? (
          <Link
            href="/profile/edit"
            className="flex-1 flex items-center justify-between px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Backup sticker
            </span>
            <span className="flex items-center gap-2">
              <span className="font-mono tracking-[0.2em] text-neutral-200">
                {currentCode}
              </span>
              <span className="text-blue-400">Manage</span>
            </span>
          </Link>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 px-3 py-2 text-sm text-neutral-400 hover:text-blue-300 hover:bg-neutral-900 rounded-lg flex items-center justify-center gap-2 transition-colors border border-dashed border-neutral-800 hover:border-blue-700/50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Link a backup sticker
          </button>
        )}
        <div className="flex items-center">
          <InfoButton isOpen={isInfoOpen} onToggle={toggleInfo} />
        </div>
      </div>

      {isInfoOpen && (
        <p className="mt-2 px-3 py-2 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-lg leading-relaxed">
          {INFO_TEXT}
        </p>
      )}

      {!currentCode && (
        <LinkStickerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
