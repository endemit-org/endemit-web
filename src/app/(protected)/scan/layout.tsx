import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { ROLE_SLUGS } from "@/domain/auth/config/roles.config";
import { LogoutButton } from "@/app/_components/auth/LogoutButton";

export default async function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/auth/sign-in");
  }

  // Check if user has scanner or admin role
  const hasAdminAccess = user.roles.some(
    role => role === ROLE_SLUGS.SCANNER || role === ROLE_SLUGS.ADMIN
  );

  if (!hasAdminAccess) {
    // Redirect to unauthorized page or home
    redirect("/");
  }

  return (
    <div className="min-h-screen ">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Scanner</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.name || user.email}
              </span>
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                {user.roles.join(", ")}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
