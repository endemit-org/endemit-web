"use client";

import { useState, useEffect } from "react";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { logTicketDownloadAction } from "@/domain/ticket/actions/logTicketDownloadAction";

interface AddToWalletButtonProps {
  ticketHash: string;
  shortId: string;
  size?: "sm" | "default";
}

export default function AddToWalletButton({
  ticketHash,
  shortId,
  size = "default",
}: AddToWalletButtonProps) {
  const [isAppleDevice, setIsAppleDevice] = useState<boolean | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const walletPassUrl = `${PUBLIC_BASE_WEB_URL}/api/v1/tickets/wallet-pass/${ticketHash}`;

  useEffect(() => {
    // Detect Apple devices (iOS, iPadOS, macOS)
    const userAgent = navigator.userAgent.toLowerCase();
    const isApple =
      /iphone|ipad|ipod|macintosh|mac os x/i.test(userAgent) &&
      // Exclude Windows pretending to be Mac
      !/windows/i.test(userAgent);
    setIsAppleDevice(isApple);
  }, []);

  const handleClick = async () => {
    if (isAppleDevice) {
      setIsLoading(true);
      // Log download to Discord (fire and forget)
      logTicketDownloadAction({ ticketShortId: shortId, downloadType: "apple_wallet" });
      // On Apple devices, navigate directly to the pass URL
      // iOS will automatically open the Wallet app
      window.location.href = walletPassUrl;

      // Reset loading state after a delay (in case user comes back)
      setTimeout(() => setIsLoading(false), 3000);
    } else {
      // On other devices, show warning
      setShowWarning(true);
    }
  };

  const handleForceDownload = () => {
    setIsLoading(true);
    setShowWarning(false);
    // Log download to Discord (fire and forget)
    logTicketDownloadAction({ ticketShortId: shortId, downloadType: "apple_wallet" });
    window.location.href = walletPassUrl;
    setTimeout(() => setIsLoading(false), 3000);
  };

  // Don't render until we know if it's an Apple device
  if (isAppleDevice === null) {
    return (
      <div className="h-12 bg-neutral-800 rounded-lg animate-pulse" />
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 px-4 bg-black hover:bg-neutral-900 text-white font-medium rounded-lg transition-colors border border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed ${size === "sm" ? "py-2" : "py-3"}`}
      >
        {isLoading ? (
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
            Adding to Wallet...
          </>
        ) : (
          <>
            {/* Apple Wallet Icon */}
            <svg
              className="w-7 h-6"
              viewBox="0 0 28 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <mask id="mask0" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="0" y="0" width="27" height="20">
                <path d="M26.4498 16.0504V16.3204C26.4498 16.4504 26.4498 16.5704 26.4498 16.7004C26.4498 16.8104 26.4498 16.9104 26.4498 17.0204C26.4498 17.2504 26.4298 17.4904 26.3898 17.7204C26.3498 17.9504 26.2798 18.1704 26.1698 18.3804C26.0598 18.5904 25.9298 18.7804 25.7598 18.9504C25.5898 19.1204 25.3998 19.2504 25.1998 19.3604C24.9898 19.4704 24.7698 19.5404 24.5398 19.5804C24.3098 19.6204 24.0698 19.6304 23.8398 19.6404C23.7298 19.6404 23.6298 19.6404 23.5198 19.6404C23.3898 19.6404 23.2698 19.6404 23.1398 19.6404H21.6798H23.0398H4.16977H5.52977H4.06977C3.93977 19.6404 3.81977 19.6404 3.68977 19.6404C3.57977 19.6404 3.47977 19.6404 3.36977 19.6404C3.13977 19.6404 2.89977 19.6204 2.66977 19.5804C2.43977 19.5404 2.21977 19.4704 2.00977 19.3604C1.79977 19.2504 1.60977 19.1204 1.44977 18.9504C1.27977 18.7804 1.14977 18.5904 1.03977 18.3804C0.929766 18.1704 0.859766 17.9504 0.819766 17.7204C0.779766 17.4904 0.769766 17.2604 0.759766 17.0204C0.759766 16.9104 0.759766 16.8104 0.759766 16.7004C0.759766 16.5704 0.759766 16.4504 0.759766 16.3204V3.89035V5.14035V3.68035C0.759766 3.55035 0.759766 3.43035 0.759766 3.30035C0.759766 3.19035 0.759766 3.09035 0.759766 2.98035C0.759766 2.75035 0.779766 2.51035 0.819766 2.28035C0.859766 2.05035 0.929766 1.83035 1.03977 1.62035C1.14977 1.41035 1.28977 1.22035 1.44977 1.05035C1.61977 0.880351 1.80977 0.750352 2.00977 0.640352C2.21977 0.530352 2.43977 0.460352 2.66977 0.420352C2.89977 0.380352 3.13977 0.370352 3.36977 0.360352C3.47977 0.360352 3.57977 0.360352 3.68977 0.360352C3.81977 0.360352 3.93977 0.360352 4.06977 0.360352H23.1198C23.2498 0.360352 23.3698 0.360352 23.4998 0.360352C23.6098 0.360352 23.7098 0.360352 23.8198 0.360352C24.0498 0.360352 24.2898 0.380352 24.5198 0.420352C24.7498 0.460352 24.9698 0.530352 25.1798 0.640352C25.3898 0.750352 25.5798 0.880351 25.7398 1.05035C25.9098 1.22035 26.0398 1.41035 26.1498 1.62035C26.2598 1.83035 26.3298 2.05035 26.3698 2.28035C26.4098 2.51035 26.4298 2.74035 26.4298 2.98035C26.4298 3.09035 26.4298 3.19035 26.4298 3.30035C26.4298 3.43035 26.4298 3.55035 26.4298 3.68035V16.0404L26.4498 16.0504Z" fill="white"/>
              </mask>
              <g mask="url(#mask0)">
                <path d="M25.6298 1.16016H1.52979V17.9402H25.6298V1.16016Z" fill="#DEDBCE"/>
                <path d="M25.3696 1.43066H1.80957V11.4307H25.3696V1.43066Z" fill="#40A5D9"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M25.3798 5.68105V5.44105C25.3798 5.37105 25.3798 5.30105 25.3798 5.24105C25.3798 5.09105 25.3698 4.94105 25.3398 4.80105C25.3098 4.65105 25.2698 4.51105 25.1998 4.38105C25.1298 4.25105 25.0398 4.13105 24.9398 4.02105C24.8398 3.92105 24.7098 3.83105 24.5798 3.76105C24.4398 3.69105 24.3098 3.65105 24.1598 3.62105C24.0098 3.59105 23.8598 3.59105 23.7198 3.58105C23.6498 3.58105 23.5798 3.58105 23.5198 3.58105H3.67982C3.60982 3.58105 3.53982 3.58105 3.47982 3.58105C3.32982 3.58105 3.17982 3.59105 3.03982 3.62105C2.88982 3.65105 2.74982 3.69105 2.61982 3.76105C2.48982 3.83105 2.36982 3.91105 2.25982 4.02105C2.15982 4.12105 2.06982 4.25105 1.99982 4.38105C1.92982 4.52105 1.88982 4.65105 1.85982 4.80105C1.82982 4.95105 1.82982 5.10105 1.81982 5.24105C1.81982 5.31105 1.81982 5.38105 1.81982 5.44105V6.61105V5.88105V13.5711H25.3798V5.68105Z" fill="#FFB003"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M25.3798 7.8207V7.5807C25.3798 7.5107 25.3798 7.4407 25.3798 7.3807C25.3798 7.2307 25.3698 7.0807 25.3398 6.9407C25.3098 6.7907 25.2698 6.6507 25.1998 6.5207C25.1298 6.3907 25.0398 6.2707 24.9398 6.1607C24.8398 6.0607 24.7098 5.9707 24.5798 5.9007C24.4398 5.8307 24.3098 5.7907 24.1598 5.7607C24.0098 5.7307 23.8598 5.7307 23.7198 5.7207C23.6498 5.7207 23.5798 5.7207 23.5198 5.7207H3.67982C3.60982 5.7207 3.53982 5.7207 3.47982 5.7207C3.32982 5.7207 3.17982 5.7307 3.03982 5.7607C2.88982 5.7907 2.74982 5.8307 2.61982 5.9007C2.48982 5.9707 2.36982 6.0507 2.25982 6.1607C2.15982 6.2607 2.06982 6.3907 1.99982 6.5207C1.92982 6.6607 1.88982 6.7907 1.85982 6.9407C1.82982 7.0907 1.82982 7.2407 1.81982 7.3807C1.81982 7.4507 1.81982 7.5207 1.81982 7.5807V8.7507V8.0207V15.7107H25.3798V7.8207Z" fill="#40C740"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M25.3798 9.96035V9.72035C25.3798 9.65035 25.3798 9.58035 25.3798 9.52035C25.3798 9.37035 25.3698 9.22035 25.3398 9.08035C25.3098 8.93035 25.2698 8.79035 25.1998 8.66035C25.1298 8.53035 25.0398 8.41035 24.9398 8.30035C24.8398 8.20035 24.7098 8.11035 24.5798 8.04035C24.4398 7.97035 24.3098 7.93035 24.1598 7.90035C24.0098 7.87035 23.8598 7.87035 23.7198 7.86035C23.6498 7.86035 23.5798 7.86035 23.5198 7.86035H3.67982C3.60982 7.86035 3.53982 7.86035 3.47982 7.86035C3.32982 7.86035 3.17982 7.87035 3.03982 7.90035C2.88982 7.93035 2.74982 7.97035 2.61982 8.04035C2.48982 8.11035 2.36982 8.19035 2.25982 8.30035C2.15982 8.40035 2.06982 8.53035 1.99982 8.66035C1.92982 8.80035 1.88982 8.93035 1.85982 9.08035C1.82982 9.23035 1.82982 9.38035 1.81982 9.52035C1.81982 9.59035 1.81982 9.66035 1.81982 9.72035V10.8904V10.1604V17.8504H25.3798V9.96035Z" fill="#F26D5F"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M0.379883 0V11.07H1.80988V3.3C1.80988 3.23 1.80988 3.16 1.80988 3.1C1.80988 2.95 1.81988 2.8 1.84988 2.66C1.87988 2.51 1.91988 2.37 1.98988 2.24C2.05988 2.11 2.13988 1.99 2.24988 1.88C2.35988 1.78 2.47988 1.69 2.60988 1.62C2.74988 1.55 2.87988 1.51 3.02988 1.48C3.17988 1.45 3.32988 1.45 3.46988 1.44C3.53988 1.44 3.60988 1.44 3.66988 1.44H23.4999C23.5699 1.44 23.6399 1.44 23.6999 1.44C23.8499 1.44 23.9999 1.45 24.1399 1.48C24.2899 1.51 24.4299 1.55 24.5599 1.62C24.6899 1.69 24.8099 1.77 24.9199 1.88C25.0199 1.98 25.1099 2.11 25.1799 2.24C25.2499 2.38 25.2899 2.51 25.3199 2.66C25.3499 2.81 25.3499 2.96 25.3599 3.1C25.3599 3.17 25.3599 3.24 25.3599 3.3V11.07H26.7899V0H0.379883Z" fill="#D9D6CC"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M20.1701 10.001C20.0201 10.001 19.8601 10.001 19.7101 10.001C19.5801 10.001 19.4501 10.001 19.3201 10.001C19.0401 10.001 18.7501 10.021 18.4801 10.071C18.2001 10.121 17.9301 10.201 17.6801 10.331C17.6501 10.351 16.9401 10.671 16.3101 11.651C15.8301 12.401 14.8901 13.191 13.5801 13.191C12.2701 13.191 11.3301 12.401 10.8501 11.651C10.1801 10.611 9.42014 10.301 9.48014 10.331C9.22014 10.201 8.96014 10.121 8.68014 10.071C8.40014 10.021 8.12014 10.001 7.84014 10.001C7.71014 10.001 7.58014 10.001 7.45014 10.001C7.30014 10.001 7.14014 10.001 6.99014 10.001H0.390137V20.001H26.8101V10.001H20.1701Z" fill="#DEDBCE"/>
              </g>
            </svg>
            Add to Apple Wallet
          </>
        )}
      </button>

      {/* Warning Modal for non-Apple devices */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">
              Apple Wallet Required
            </h3>
            <p className="text-neutral-400 mb-4">
              Apple Wallet passes work best on iPhone, iPad, or Mac. You can
              still download the pass file, but you may not be able to open it
              on this device.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForceDownload}
                className="flex-1 px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-lg transition-colors"
              >
                Download Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
