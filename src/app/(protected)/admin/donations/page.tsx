import { Metadata } from "next";
import { redirect } from "next/navigation";
import { fetchDonations } from "@/domain/order/actions/fetchDonationsAction";
import DonationsDisplay from "@/app/_components/admin/DonationsDisplay";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

export const metadata: Metadata = {
  title: "Donations  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDonationsPage() {
  const currentUser = await getCurrentUser();

  // Permission check - donations are part of orders
  if (!currentUser?.permissions.includes(PERMISSIONS.ORDERS_READ_ALL)) {
    redirect("/admin");
  }

  const donationsData = await fetchDonations();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
        <p className="text-gray-500 mt-1">
          View all donations from completed orders
        </p>
      </div>

      <DonationsDisplay initialData={donationsData} />
    </div>
  );
}
