"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { useState, useEffect } from "react";
import { QrTicketPayload } from "@/domain/ticket/types/ticket";
import { scanTicketAtEventAction } from "@/domain/ticket/actions/scanTicketAtEventAction";
import { verifyTicketAtEventAction } from "@/domain/ticket/actions/verifyTicketAtEventAction";
import ActionButton from "@/app/_components/form/ActionButton";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import AnimatedSuccessIcon from "@/app/_components/icon/AnimatedSuccessIcon";
import { formatDecimalPrice } from "@/lib/util/formatting";
import { playBeep, playBlorp } from "@/domain/ticket/util";
import { useTranslations } from "next-intl";

interface ScanResult {
  rawValue: string;
  format: string;
}

interface VerificationResult {
  success: boolean;
  scanCount: number;
  message?: string;
}

type VerificationStatus = "success" | "warning" | "error";

type Props = {
  eventId: string;
};

const getVerificationStatus = (
  verification: VerificationResult | null
): VerificationStatus => {
  if (!verification) return "error";
  if (!verification.success) return "error";
  if (verification.scanCount === 1) return "success";
  return "warning";
};

const getVerificationStyles = (status: VerificationStatus) => {
  const styles = {
    success: {
      bg: "bg-green-100 text-green-800",
      icon: "✓",
      titleKey: "verified",
    },
    warning: {
      bg: "bg-yellow-100 text-yellow-800",
      icon: "⚠",
      titleKey: "warning",
    },
    error: {
      bg: "bg-red-100 text-red-800",
      icon: "✗",
      titleKey: "error",
    },
  } as const;
  return styles[status];
};

export default function QRScanner({ eventId }: Props) {
  const t = useTranslations("scan");
  const [isOpen, setIsOpen] = useState(false);
  const [scannedData, setScannedData] = useState<QrTicketPayload | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(
    null
  );
  const [isMarkingOnServer, setIsMarkingOnServer] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{ scanCount: number } | null>(
    null
  );

  useEffect(() => {
    if (scanResult && scanResult.scanCount === 1) {
      const timer = setTimeout(() => {
        resetScanState();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  const resetScanState = () => {
    setScannedData(null);
    setVerification(null);
    setIsMarkingOnServer(false);
    setScanResult(null);
  };

  const handleWrongEvent = () => {
    playBlorp();
    setIsMarkingOnServer(false);
    setVerification({
      success: false,
      scanCount: 0,
      message: t("result.wrongEvent"),
    });
  };

  const handleScanSuccess = async (ticketPayload: QrTicketPayload) => {
    try {
      const response = await verifyTicketAtEventAction(ticketPayload);

      if (response.success && response.verified) {
        const markTicketScan = await scanTicketAtEventAction({
          scannedData: ticketPayload,
        });

        if (!markTicketScan.success) {
          const message =
            markTicketScan.message ?? t("result.alreadyScanned");

          playBlorp();
          setIsMarkingOnServer(false);
          setVerification({
            success: false,
            scanCount: 0,
            message:
              markTicketScan.reason === "already_scanned"
                ? t("result.alreadyScanned")
                : message,
          });
          return;
        }

        playBeep();
        setIsMarkingOnServer(false);
        setScanResult({
          scanCount: markTicketScan.scannedTicketData.scanCount,
        });
        setVerification({
          success: true,
          scanCount: markTicketScan.scannedTicketData.scanCount,
          message:
            markTicketScan.scannedTicketData.scanCount === 1
              ? t("result.validTicket")
              : t("result.scannedTimes", {
                  count: markTicketScan.scannedTicketData.scanCount,
                }),
        });
      }
    } catch (error) {
      playBlorp();
      setIsMarkingOnServer(false);
      console.error(error);
    }
  };

  const handleScan = async (result: ScanResult[]) => {
    if (result && result.length > 0) {
      const ticketPayload = JSON.parse(result[0].rawValue) as QrTicketPayload;
      setScannedData(ticketPayload);
      setIsMarkingOnServer(true);

      if (ticketPayload.eventId !== eventId) {
        handleWrongEvent();
        return;
      }

      await handleScanSuccess(ticketPayload);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    resetScanState();
  };

  const shouldShowActionButton = (verification: VerificationResult | null) => {
    if (!verification) return false;
    if (!verification.success) return false;
    return !verification.success || verification.scanCount > 1;
  };

  const renderTicketDetails = (scannedData: QrTicketPayload) => {
    const details = [
      {
        label: t("result.ticketHolderName"),
        value: scannedData.ticketHolderName,
      },
      {
        label: t("result.paymentEmail"),
        value: scannedData.ticketPayerEmail,
      },
      {
        label: t("result.ticketPrice"),
        value: formatDecimalPrice(scannedData.price),
      },
    ];

    return (
      <div className="flex flex-col gap-y-6">
        {details.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <div className="text-md">{item.label}:</div>
            <div className="text-2xl font-bold">{item.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderVerificationResult = () => {
    if (isMarkingOnServer) {
      return (
        <div className="flex items-center gap-2 text-gray-600 text-center py-5">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          <span>{t("scanner.recordingScan")}</span>
        </div>
      );
    }

    if (!verification) return null;

    const status = getVerificationStatus(verification);
    const styles = getVerificationStyles(status);

    return (
      <div className="space-y-3">
        <div className={`p-4 rounded-lg ${styles.bg}`}>
          <div className="font-semibold">
            {styles.icon} {t(`result.${styles.titleKey}`)}
          </div>
          <div className="text-sm mt-1">{verification.message}</div>
          {verification.success && (
            <div
              className={`text-sm mt-1 font-semibold ${
                verification.scanCount > 1 ? "text-yellow-900" : ""
              }`}
            >
              {t("result.scanCount", { count: verification.scanCount })}
            </div>
          )}
        </div>
        {shouldShowActionButton(verification) && (
          <ActionButton onClick={resetScanState}>
            {t("scanner.scanNext")}
          </ActionButton>
        )}
      </div>
    );
  };

  return (
    <div className="">
      <ActionButton onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? t("scanner.closeScanner") : t("scanner.scanTicket")}
      </ActionButton>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[90vh] overflow-auto text-neutral-900">
            <div className="p-4 relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {t("scanner.modalTitle")}
                </h2>
                <button
                  onClick={handleCloseModal}
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

              {!scannedData && (
                <div className="mb-4">
                  <div className="text-neutral-950 p-4 mb-12 flex items-center justify-center">
                    <AnimatedEndemitLogo />
                  </div>
                  <Scanner
                    onScan={handleScan}
                    onError={error => console.error(error)}
                    components={{
                      finder: true,
                      torch: true,
                      zoom: true,
                    }}
                    sound={false}
                  />
                  <div className="mt-12 text-center">
                    {t("scanner.pointCamera")}
                  </div>
                </div>
              )}

              {scannedData && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div
                      className={`flex items-center mb-2 gap-x-5 ${verification && !verification.success ? "text-red-800" : ""}`}
                    >
                      {verification && verification.success && (
                        <AnimatedSuccessIcon strokeWidth={7} />
                      )}
                      <h3 className="text-6xl font-semibold tracking-widest">
                        {scannedData.shortId}
                      </h3>
                    </div>
                  </div>

                  <div
                    className={
                      verification && !verification.success
                        ? "text-red-800"
                        : ""
                    }
                  >
                    {renderTicketDetails(scannedData)}
                  </div>

                  <div className="border-t pt-4">
                    {renderVerificationResult()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
