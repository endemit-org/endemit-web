"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { triggerDeployAction } from "@/domain/deploy/actions/triggerDeployAction";

export default function DeployTriggerDisplay() {
  const t = useTranslations("admin.deploy");
  const [confirming, setConfirming] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggeredAt, setTriggeredAt] = useState<Date | null>(null);

  const handleTrigger = async () => {
    setIsTriggering(true);
    setError(null);
    try {
      const result = await triggerDeployAction();
      if (!result.success) {
        setError(result.message || t("errorGeneric"));
        return;
      }
      setTriggeredAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setIsTriggering(false);
      setConfirming(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-xl">
      <p className="text-sm text-gray-600 mb-4">{t("explainer")}</p>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {triggeredAt && !error && (
        <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {t("triggered", { time: triggeredAt.toLocaleTimeString() })}
        </div>
      )}

      {confirming ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 font-medium">
            {t("confirmText")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleTrigger}
              disabled={isTriggering}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isTriggering ? t("triggering") : t("confirmButton")}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={isTriggering}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {t("cancelButton")}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setConfirming(true);
            setError(null);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {t("triggerButton")}
        </button>
      )}
    </div>
  );
}
