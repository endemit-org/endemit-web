import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllDiscountCodes } from "@/domain/discount/operations/getAllDiscountCodes";
import { transformDiscountCodeToRule } from "@/domain/discount/transformers/transformDiscountCodeToRule";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import DiscountCodesDisplay from "@/app/_components/admin/DiscountCodesDisplay";

export const metadata: Metadata = {
  title: "Discount Codes  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDiscountsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.DISCOUNTS_READ)) {
    redirect("/admin");
  }

  const t = await getTranslations("admin.discounts");

  const [records, products] = await Promise.all([
    getAllDiscountCodes(),
    fetchProductsFromCms({}),
  ]);
  const codes = records.map(transformDiscountCodeToRule);
  const productOptions = (products ?? []).map(product => ({
    uid: product.uid,
    name: product.name,
    price: product.price,
  }));
  const canWrite = currentUser.permissions.includes(
    PERMISSIONS.DISCOUNTS_WRITE
  );

  const totalRedemptions = codes.reduce((sum, code) => sum + code.usedCount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">
            {t("stats.total")}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {codes.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">
            {t("stats.active")}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {codes.filter(code => code.status === "ACTIVE").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">
            {t("stats.redemptions")}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {totalRedemptions}
          </div>
        </div>
      </div>

      <DiscountCodesDisplay
        initialCodes={codes}
        products={productOptions}
        canWrite={canWrite}
      />
    </div>
  );
}
