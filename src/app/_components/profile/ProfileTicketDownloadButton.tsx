"use client";

import { useState } from "react";
import { generateUserTicketImageAction } from "@/domain/ticket/actions/generateUserTicketImageAction";
import { sanitizeForFilename } from "@/lib/util/formatting";

interface ProfileTicketDownloadButtonProps {
  shortId: string;
  holderName: string;
}

export default function ProfileTicketDownloadButton({
  shortId,
  holderName,
}: ProfileTicketDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTicket = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateUserTicketImageAction(shortId);

      if (!result) {
        setError("No response from server");
        return;
      }

      if (!result.success || !result.image) {
        setError(result.error || "Failed to generate ticket");
        return;
      }

      // Create blob from base64 and download
      const byteCharacters = atob(result.image);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ticket-${shortId}-${sanitizeForFilename(holderName)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate ticket");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleDownloadTicket}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </>
        ) : (
          <>
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Ticket Image
          </>
        )}
      </button>
      {error && <p className="mt-2 text-sm text-red-400 text-center">{error}</p>}
    </div>
  );
}
