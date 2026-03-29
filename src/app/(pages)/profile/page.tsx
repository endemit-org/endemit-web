import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import Link from "next/link";
import ProfileEditForm from "@/app/_components/profile/ProfileEditForm";

export const metadata: Metadata = {
  title: "My Profile",
  description: "View and manage your Endemit account",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <OuterPage>
      <PageHeadline
        title="My Profile"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Profile", path: "profile" },
        ]}
      />

      <InnerPage>
        <div className="space-y-8">
          {/* Wallet Card */}
          <Link
            href="/profile/wallet"
            className="block bg-neutral-800 hover:bg-neutral-700 rounded-lg p-6 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-200 group-hover:text-white">
                  My Wallet
                </h3>
                <p className="text-sm text-neutral-400">
                  View your balance and transaction history
                </p>
              </div>
            </div>
          </Link>

          {/* Quick Links */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-200 mb-4">
              Quick Links
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/profile/orders"
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg p-6 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-200 group-hover:text-white">
                      My Orders
                    </h3>
                    <p className="text-sm text-neutral-400">
                      View your order history
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/profile/tickets"
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg p-6 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-200 group-hover:text-white">
                      My Tickets
                    </h3>
                    <p className="text-sm text-neutral-400">
                      View your event tickets
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* Edit Profile */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-200 mb-4">
              Edit Profile
            </h2>
            <div className="bg-neutral-800 rounded-lg p-6">
              <ProfileEditForm name={user.name} image={user.image} />
            </div>
          </section>

          {/* Account Details */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-200 mb-4">
              Account Details
            </h2>
            <div className="bg-neutral-800 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-400">Email</span>
                <span className="text-neutral-200">{user.email}</span>
              </div>
              {user.name && (
                <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                  <span className="text-neutral-400">Name</span>
                  <span className="text-neutral-200">{user.name}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </InnerPage>
    </OuterPage>
  );
}
