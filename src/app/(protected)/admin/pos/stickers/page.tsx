import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  listStickers,
  type StickerListFilter,
} from "@/domain/sticker/operations/listStickers";
import StickerPoolDisplay from "@/app/_components/admin/StickerPoolDisplay";

export const metadata: Metadata = {
  title: "POS Stickers  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminPosStickersPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.permissions.includes(PERMISSIONS.POS_STICKERS_MANAGE)) {
    redirect("/admin");
  }

  const resolvedSearch = await searchParams;
  const rawFilter = resolvedSearch.filter ?? "all";
  const filter: StickerListFilter =
    rawFilter === "claimed" || rawFilter === "unclaimed" ? rawFilter : "all";
  const search = resolvedSearch.search?.trim() ?? "";
  const page = Math.max(1, Number(resolvedSearch.page ?? "1") || 1);

  const result = await listStickers({
    filter,
    search: search || undefined,
    page,
    pageSize: 50,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">POS Stickers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the pool of pre-printed backup sticker codes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {result.claimedCount + result.unclaimedCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Claimed</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {result.claimedCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Unclaimed</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {result.unclaimedCount}
          </div>
        </div>
      </div>

      <StickerPoolDisplay
        initial={{
          items: result.items.map(i => ({
            code: i.code,
            userId: i.userId,
            claimedAt: i.claimedAt?.toISOString() ?? null,
            user: i.user,
          })),
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          filter,
          search,
        }}
      />
    </div>
  );
}
