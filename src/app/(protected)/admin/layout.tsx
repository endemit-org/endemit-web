import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { ROLE_SLUGS } from "@/domain/auth/config/roles.config";
import AdminSidebar from "@/app/_components/admin/AdminSidebar";
import AdminHeader from "@/app/_components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/auth/sign-in");
  }

  // Check if user has admin or moderator role
  const hasAdminAccess = user.roles.some(
    role => role === ROLE_SLUGS.ADMIN || role === ROLE_SLUGS.MODERATOR
  );

  if (!hasAdminAccess) {
    // Redirect to unauthorized page or home
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          userName={user.name}
          userEmail={user.email}
          userRoles={user.roles}
        />
        <main className="flex-1 py-6 px-4 lg:px-8 overflow-x-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
