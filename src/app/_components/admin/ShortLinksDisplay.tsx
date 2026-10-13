"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getApiPath } from "@/lib/util/api";
import {
  buildShortLinkUrl,
  validateShortCode,
  validateTargetUrl,
} from "@/domain/shortLink/businessLogic";
import type { ShortLinkRecord } from "@/domain/shortLink/types";
import ShortLinkQrModal from "@/app/_components/admin/ShortLinkQrModal";
import { formatDateTime } from "@/lib/util/formatting";

interface ShortLinksDisplayProps {
  links: ShortLinkRecord[];
  canWrite: boolean;
  /** Base URL of the environment this is running in, for the full link. */
  baseUrl: string;
}

interface FormState {
  id?: string;
  code: string;
  targetUrl: string;
  description: string;
}

const EMPTY_FORM: FormState = { code: "", targetUrl: "", description: "" };

export default function ShortLinksDisplay({
  links,
  canWrite,
  baseUrl,
}: ShortLinksDisplayProps) {
  const t = useTranslations("admin.shortLinks");
  const router = useRouter();

  const [form, setForm] = useState<FormState | null>(null);
  const [qrLink, setQrLink] = useState<ShortLinkRecord | null>(null);
  const [error, setError] = useState<string>("");
  const [busyId, setBusyId] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string>("");

  const isEditing = Boolean(form?.id);

  const submit = async () => {
    if (!form) return;
    setError("");

    const targetError = validateTargetUrl(form.targetUrl);
    if (targetError) {
      setError(targetError);
      return;
    }

    // An empty code on create means "generate one"; on edit it would mean
    // clearing the code, which is not a thing.
    if (form.code.trim() || isEditing) {
      const codeError = validateShortCode(form.code);
      if (codeError) {
        setError(codeError);
        return;
      }
    }

    setBusyId(form.id ?? "new");
    try {
      const response = await fetch(
        form.id
          ? getApiPath(`admin/short-links/${form.id}`)
          : getApiPath("admin/short-links"),
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: form.code.trim() || undefined,
            targetUrl: form.targetUrl,
            description: form.description,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || t("saveFailed"));

      setForm(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setBusyId("");
    }
  };

  const toggleActive = async (link: ShortLinkRecord) => {
    setError("");
    setBusyId(link.id);
    try {
      const response = await fetch(
        getApiPath(`admin/short-links/${link.id}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !link.isActive }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || t("saveFailed"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setBusyId("");
    }
  };

  const remove = async (link: ShortLinkRecord) => {
    // Deleting breaks anything already printed with this code, so the
    // confirmation names the code rather than asking a generic "are you sure".
    if (!window.confirm(t("deleteConfirm", { code: link.code }))) return;

    setError("");
    setBusyId(link.id);
    try {
      const response = await fetch(
        getApiPath(`admin/short-links/${link.id}`),
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || t("deleteFailed"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deleteFailed"));
    } finally {
      setBusyId("");
    }
  };

  const copyUrl = async (link: ShortLinkRecord) => {
    try {
      await navigator.clipboard.writeText(buildShortLinkUrl(baseUrl, link.code));
      setCopiedCode(link.code);
      window.setTimeout(() => setCopiedCode(""), 2000);
    } catch {
      setError(t("copyFailed"));
    }
  };

  return (
    <div className="text-gray-900">
      {canWrite && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              setError("");
              setForm({ ...EMPTY_FORM });
            }}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {t("addLink")}
          </button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {form && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            {isEditing ? t("editLink") : t("newLink")}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                {t("fieldCode")}
              </span>
              <input
                type="text"
                value={form.code}
                onChange={event =>
                  setForm({ ...form, code: event.target.value })
                }
                placeholder={t("fieldCodePlaceholder")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
              />
              <span className="mt-1 block text-xs text-gray-500">
                {t("fieldCodeHint")}
              </span>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                {t("fieldTarget")}
              </span>
              <input
                type="url"
                value={form.targetUrl}
                onChange={event =>
                  setForm({ ...form, targetUrl: event.target.value })
                }
                placeholder="https://"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-gray-700">
                {t("fieldDescription")}
              </span>
              <input
                type="text"
                value={form.description}
                onChange={event =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder={t("fieldDescriptionPlaceholder")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={Boolean(busyId)}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(null);
                setError("");
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  {t("columnCode")}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  {t("columnTarget")}
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  {t("columnClicks")}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  {t("columnStatus")}
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  {t("columnActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {links.map(link => (
                <tr key={link.id} className={link.isActive ? "" : "bg-gray-50"}>
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-gray-900">
                      /go/{link.code}
                    </span>
                    {link.description && (
                      <span className="block text-xs text-gray-500">
                        {link.description}
                      </span>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <a
                      href={link.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-blue-600 hover:underline"
                    >
                      {link.targetUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium text-gray-900">
                      {link.clickCount}
                    </span>
                    {link.lastClickAt && (
                      <span className="block text-xs text-gray-500">
                        {formatDateTime(new Date(link.lastClickAt))}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        link.isActive
                          ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                          : "rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700"
                      }
                    >
                      {link.isActive ? t("statusActive") : t("statusDisabled")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setQrLink(link)}
                        className="text-xs font-medium text-gray-700 hover:underline"
                      >
                        {t("actionQr")}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyUrl(link)}
                        className="text-xs font-medium text-gray-700 hover:underline"
                      >
                        {copiedCode === link.code ? t("copied") : t("actionCopy")}
                      </button>
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setError("");
                              setForm({
                                id: link.id,
                                code: link.code,
                                targetUrl: link.targetUrl,
                                description: link.description ?? "",
                              });
                            }}
                            className="text-xs font-medium text-gray-700 hover:underline"
                          >
                            {t("actionEdit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(link)}
                            disabled={busyId === link.id}
                            className="text-xs font-medium text-gray-700 hover:underline disabled:opacity-50"
                          >
                            {link.isActive ? t("actionDisable") : t("actionEnable")}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(link)}
                            disabled={busyId === link.id}
                            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                          >
                            {t("actionDelete")}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {qrLink && (
        <ShortLinkQrModal
          code={qrLink.code}
          url={buildShortLinkUrl(baseUrl, qrLink.code)}
          onClose={() => setQrLink(null)}
        />
      )}
    </div>
  );
}
