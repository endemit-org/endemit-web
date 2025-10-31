import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { ROLE_SLUGS } from "@/domain/auth/config/roles.config";
import { LogoutButton } from "@/app/_components/auth/LogoutButton";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import {
  ContextMenu,
  ContextMenuDivider,
  ContextMenuLabel,
} from "@/app/_components/ui/ContextMenu";

export default async function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/auth/sign-in?redirect=/scan");
  }

  // Check if user has scanner or admin role
  const hasScannerAccess = user.roles.some(
    role => role === ROLE_SLUGS.SCANNER || role === ROLE_SLUGS.ADMIN
  );

  if (!hasScannerAccess) {
    // Redirect to unauthorized page or home
    redirect("/");
  }

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-black w-24 lg:w-32">
                  <AnimatedEndemitLogo />
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ContextMenu
                trigger={
                  <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none">
                    <span>{user.name || user.email}</span>
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                }
              >
                <ContextMenuLabel>
                  <div className="font-medium">{user.name || user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {user.roles.join(", ")}
                  </div>
                </ContextMenuLabel>
                <ContextMenuDivider />
                <ContextMenuLabel>
                  <LogoutButton />
                </ContextMenuLabel>
              </ContextMenu>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10 p-4 lg:p-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  );
}
