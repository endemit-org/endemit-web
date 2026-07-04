"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ActionButton from "@/app/_components/form/ActionButton";
import { terminateSessionAction } from "@/domain/user/actions/terminateSessionAction";
import { terminateAllSessionsAction } from "@/domain/user/actions/terminateAllSessionsAction";
import ClientDate from "@/app/_components/ui/ClientDate";
import type { SerializedSession } from "@/domain/user/types";

interface UserSessionsTableProps {
  userId: string;
  sessions: SerializedSession[];
}

function parseUserAgent(ua: string): string {
  // Simple user agent parsing
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Opera")) return "Opera";

  return ua.length > 30 ? `${ua.slice(0, 30)}...` : ua;
}

export default function UserSessionsTable({
  userId,
  sessions,
}: UserSessionsTableProps) {
  const router = useRouter();
  const t = useTranslations("admin.users");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTerminateSession = async (sessionId: string) => {
    setLoadingSessionId(sessionId);
    setError(null);

    try {
      await terminateSessionAction(sessionId);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to terminate session"
      );
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleTerminateAll = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await terminateAllSessionsAction(userId);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to terminate sessions"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4">{t("sessions.none")}</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ActionButton
          onClick={handleTerminateAll}
          disabled={isLoading}
          size="sm"
          variant="danger"
          fullWidth={false}
        >
          {isLoading ? t("sessions.terminatingAll") : t("sessions.terminateAll")}
        </ActionButton>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("sessions.started")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("sessions.ipAddress")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("sessions.device")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("sessions.expires")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("sessions.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map(session => (
              <tr key={session.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <ClientDate date={session.createdAt} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {session.ipAddress || "-"}
                </td>
                <td
                  className="px-4 py-3 whitespace-nowrap text-sm text-gray-600"
                  title={session.userAgent || undefined}
                >
                  {session.userAgent
                    ? parseUserAgent(session.userAgent)
                    : t("sessions.unknown")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  <ClientDate date={session.expiresAt} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    disabled={loadingSessionId === session.id}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    {loadingSessionId === session.id
                      ? t("sessions.terminating")
                      : t("sessions.terminate")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
