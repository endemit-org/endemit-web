import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getWalletById } from "@/domain/wallet/operations/getWalletById";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import AdminWalletDetail from "@/app/_components/admin/AdminWalletDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wallet = await getWalletById(id);

  return {
    title: wallet
      ? `${wallet.user?.username || "Wallet"}  •  Wallets  •  Admin`
      : "Wallet Not Found  •  Admin",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminWalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.WALLETS_READ)) {
    redirect("/admin");
  }

  const wallet = await getWalletById(id);

  if (!wallet) {
    notFound();
  }

  const canManageBalance = currentUser.permissions.includes(
    PERMISSIONS.WALLETS_MANAGE_BALANCE
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/wallets"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Wallets
        </Link>
      </div>

      <AdminWalletDetail wallet={wallet} canManageBalance={canManageBalance} />
    </div>
  );
}
