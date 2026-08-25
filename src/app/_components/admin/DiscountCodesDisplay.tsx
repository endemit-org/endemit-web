"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type {
  DiscountCodeUpsertInput,
  DiscountRule,
} from "@/domain/discount/types/discount";
import { createDiscountCodeAction } from "@/domain/discount/actions/createDiscountCodeAction";
import { updateDiscountCodeAction } from "@/domain/discount/actions/updateDiscountCodeAction";
import { deleteDiscountCodeAction } from "@/domain/discount/actions/deleteDiscountCodeAction";

export interface ProductOption {
  uid: string;
  name: string;
  price: number;
}

interface Props {
  initialCodes: DiscountRule[];
  products: ProductOption[];
  canWrite: boolean;
}

const inputClass =
  "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

/** ISO string → value for <input type="datetime-local"> in local time. */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function ProductMultiSelect({
  name,
  label,
  products,
  selected,
}: {
  name: string;
  label: string;
  products: ProductOption[];
  selected: string[];
}) {
  const t = useTranslations("admin.discounts");
  const [filter, setFilter] = useState("");
  const filtered = useMemo(
    () =>
      products.filter(product =>
        product.name.toLowerCase().includes(filter.toLowerCase())
      ),
    [products, filter]
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder={t("filterProducts")}
        className={inputClass}
      />
      <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-300 divide-y divide-gray-100 bg-white">
        {filtered.map(product => (
          <label
            key={product.uid}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              name={name}
              value={product.uid}
              defaultChecked={selected.includes(product.uid)}
            />
            <span className="flex-1">{product.name}</span>
            <span className="text-gray-400">€{product.price}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-400">
            {t("noProducts")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiscountCodesDisplay({
  initialCodes,
  products,
  canWrite,
}: Props) {
  const t = useTranslations("admin.discounts");
  const tc = useTranslations("admin.common");
  const terr = useTranslations("admin.common.errors");
  const [codes, setCodes] = useState<DiscountRule[]>(initialCodes);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const buildInput = (formData: FormData): DiscountCodeUpsertInput => {
    const numberOrNull = (field: string) => {
      const raw = formData.get(field) as string;
      return raw ? parseFloat(raw) : null;
    };
    const dateOrNull = (field: string) => {
      const raw = formData.get(field) as string;
      return raw ? new Date(raw).toISOString() : null;
    };
    return {
      code: formData.get("code") as string,
      description: (formData.get("description") as string) || null,
      type: formData.get("type") as DiscountCodeUpsertInput["type"],
      valueType: formData.get(
        "valueType"
      ) as DiscountCodeUpsertInput["valueType"],
      value: parseFloat(formData.get("value") as string),
      targetProductUids: formData.getAll("targetProductUids") as string[],
      containsItemUids: formData.getAll("containsItemUids") as string[],
      minOrderAmount: numberOrNull("minOrderAmount"),
      validFrom: dateOrNull("validFrom"),
      validUntil: dateOrNull("validUntil"),
      maxUses: numberOrNull("maxUses"),
      status: formData.get("status") as DiscountCodeUpsertInput["status"],
    };
  };

  const handleCreate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const created = await createDiscountCodeAction(buildInput(formData));
        setCodes(prev => [created, ...prev]);
        setShowForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : terr("saveFailed"));
      }
    });
  };

  const handleUpdate = (formData: FormData) => {
    if (!editingCode) return;
    setError(null);
    startTransition(async () => {
      try {
        const updated = await updateDiscountCodeAction(
          editingCode.id,
          buildInput(formData)
        );
        setCodes(prev =>
          prev.map(code => (code.id === updated.id ? updated : code))
        );
        setEditingCode(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : terr("saveFailed"));
      }
    });
  };

  const handleToggleStatus = (code: DiscountRule) => {
    startTransition(async () => {
      const updated = await updateDiscountCodeAction(code.id, {
        status: code.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      setCodes(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    });
  };

  const handleDelete = (code: DiscountRule) => {
    if (!window.confirm(t("confirmDelete", { code: code.code }))) return;
    startTransition(async () => {
      await deleteDiscountCodeAction(code.id);
      setCodes(prev => prev.filter(c => c.id !== code.id));
    });
  };

  const CodeForm = ({
    code,
    onSubmit,
    onCancel,
  }: {
    code?: DiscountRule;
    onSubmit: (formData: FormData) => void;
    onCancel: () => void;
  }) => {
    const [type, setType] = useState<DiscountRule["type"]>(
      code?.type ?? "CART"
    );

    return (
      <form action={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-medium">
          {code ? t("editCode") : t("newCode")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("fieldCode")}
            </label>
            <input
              name="code"
              type="text"
              required
              defaultValue={code?.code}
              className={`${inputClass} uppercase`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("fieldDescription")}
            </label>
            <input
              name="description"
              type="text"
              defaultValue={code?.description ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("fieldType")}
            </label>
            <select
              name="type"
              value={type}
              onChange={e => setType(e.target.value as DiscountRule["type"])}
              className={inputClass}
            >
              <option value="CART">{t("typeCart")}</option>
              <option value="ITEM">{t("typeItem")}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("fieldValueType")}
              </label>
              <select
                name="valueType"
                defaultValue={code?.valueType ?? "PERCENTAGE"}
                className={inputClass}
              >
                <option value="PERCENTAGE">{t("valuePercentage")}</option>
                <option value="ABSOLUTE">{t("valueAbsolute")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("fieldValue")}
              </label>
              <input
                name="value"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={code?.value ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          {type === "ITEM" && (
            <div className="sm:col-span-2">
              <ProductMultiSelect
                name="targetProductUids"
                label={t("fieldTargetProducts")}
                products={products}
                selected={code?.targetProductUids ?? []}
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <ProductMultiSelect
              name="containsItemUids"
              label={t("fieldContainsItems")}
              products={products}
              selected={code?.containsItemUids ?? []}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("containsItemsHint")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("fieldMinOrderAmount")}
            </label>
            <input
              name="minOrderAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={code?.minOrderAmount ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("fieldMaxUses")}
            </label>
            <input
              name="maxUses"
              type="number"
              step="1"
              min="1"
              defaultValue={code?.maxUses ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("fieldValidFrom")}
            </label>
            <input
              name="validFrom"
              type="datetime-local"
              defaultValue={toDatetimeLocal(code?.validFrom ?? null)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("fieldValidUntil")}
            </label>
            <input
              name="validUntil"
              type="datetime-local"
              defaultValue={toDatetimeLocal(code?.validUntil ?? null)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("fieldStatus")}
            </label>
            <select
              name="status"
              defaultValue={code?.status ?? "ACTIVE"}
              className={inputClass}
            >
              <option value="ACTIVE">{t("statusActive")}</option>
              <option value="INACTIVE">{t("statusInactive")}</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {tc("cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? t("saving") : code ? t("update") : tc("create")}
          </button>
        </div>
      </form>
    );
  };

  const describeValue = (code: DiscountRule) =>
    code.valueType === "PERCENTAGE" ? `-${code.value}%` : `-€${code.value}`;

  const describeQualifiers = (code: DiscountRule) => {
    const parts: string[] = [];
    if (code.containsItemUids.length) {
      parts.push(t("qualContains", { count: code.containsItemUids.length }));
    }
    if (code.minOrderAmount != null) {
      parts.push(t("qualMinAmount", { amount: code.minOrderAmount }));
    }
    if (code.validFrom) {
      parts.push(
        t("qualFrom", { date: new Date(code.validFrom).toLocaleDateString() })
      );
    }
    if (code.validUntil) {
      parts.push(
        t("qualUntil", { date: new Date(code.validUntil).toLocaleDateString() })
      );
    }
    return parts.join(" · ") || "—";
  };

  return (
    <div className="space-y-6">
      {canWrite && !showForm && !editingCode && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {t("addCode")}
        </button>
      )}

      {showForm && (
        <CodeForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {editingCode && (
        <CodeForm
          code={editingCode}
          onSubmit={handleUpdate}
          onCancel={() => setEditingCode(null)}
        />
      )}

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colCode")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colDiscount")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colQualifiers")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colUses")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colStatus")}
              </th>
              {canWrite && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("colActions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {codes.map(code => (
              <tr key={code.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono font-medium text-gray-900">
                    {code.code}
                  </div>
                  {code.description && (
                    <div className="text-sm text-gray-500">
                      {code.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {describeValue(code)}
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      code.type === "ITEM"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {code.type === "ITEM"
                      ? t("typeItemBadge", {
                          count: code.targetProductUids.length,
                        })
                      : t("typeCartBadge")}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {describeQualifiers(code)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {code.usedCount}
                  {code.maxUses != null && ` / ${code.maxUses}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      code.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {code.status === "ACTIVE"
                      ? t("statusActive")
                      : t("statusInactive")}
                  </span>
                </td>
                {canWrite && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button
                      onClick={() => setEditingCode(code)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {tc("edit")}
                    </button>
                    <button
                      onClick={() => handleToggleStatus(code)}
                      disabled={isPending}
                      className="text-amber-600 hover:text-amber-900 disabled:opacity-50"
                    >
                      {code.status === "ACTIVE"
                        ? t("deactivate")
                        : t("activate")}
                    </button>
                    <button
                      onClick={() => handleDelete(code)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {t("delete")}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td
                  colSpan={canWrite ? 6 : 5}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {t("emptyCodes")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
