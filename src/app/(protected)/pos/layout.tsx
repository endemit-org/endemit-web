import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { LogoutButton } from "@/app/_components/auth/LogoutButton";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import {
  ContextMenu,
  ContextMenuDivider,
  ContextMenuLabel,
} from "@/app/_components/ui/ContextMenu";
import Link from "next/link";

export default async function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/pos");
  }

  const hasPosAccess = user.permissions.includes(PERMISSIONS.POS_ACCESS);

  if (!hasPosAccess) {
    redirect("/");
  }

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/pos" className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-black w-24 lg:w-32">
                  <AnimatedEndemitLogo />
                </h1>
              </Link>
              <span className="text-sm font-medium text-gray-500">
                Point of Sale
              </span>
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
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50">{children}</main>
    </>
  );
}
