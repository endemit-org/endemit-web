import { Metadata } from "next";
import { redirect } from "next/navigation";
import { fetchDonations } from "@/domain/order/actions/fetchDonationsAction";
import { getAggregatedDonors } from "@/domain/order/operations/getAggregatedDonors";
import DonationsDisplay from "@/app/_components/admin/DonationsDisplay";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { formatCurrency } from "@/lib/util/formatting";

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

  const [donationsData, donorsData] = await Promise.all([
    fetchDonations(),
    getAggregatedDonors(),
  ]);
  const averageDonation =
    donationsData.totalCount > 0
      ? donationsData.totalAmount / donationsData.totalCount
      : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
        <p className="text-gray-500 mt-1">
          View all donations from completed orders
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Donated</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {formatCurrency(donationsData.totalAmount)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Donations</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {donationsData.totalCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Average</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCurrency(averageDonation)}
          </div>
        </div>
      </div>

      <DonationsDisplay
        initialData={donationsData}
        initialDonorsData={donorsData}
      />
    </div>
  );
}
