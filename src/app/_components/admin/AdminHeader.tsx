"use client";

import { useState } from "react";
import Link from "next/link";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import {
  ContextMenu,
  ContextMenuDivider,
  ContextMenuLabel,
} from "@/app/_components/ui/ContextMenu";
import { LogoutButton } from "@/app/_components/auth/LogoutButton";
import { MobileNavTrigger, MobileNav } from "@/app/_components/admin/AdminSidebar";

interface AdminHeaderProps {
  userName: string | null;
  userEmail: string | null | undefined;
  userRoles: string[];
}

export default function AdminHeader({
  userName,
  userEmail,
  userRoles,
}: AdminHeaderProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <MobileNavTrigger onClick={() => setIsMobileNavOpen(true)} />
              <Link href="/admin" className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-black w-24 lg:w-32">
                  <AnimatedEndemitLogo />
                </h1>
              </Link>
              <span className="text-gray-400 text-sm font-medium hidden sm:inline">
                Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ContextMenu
                trigger={
                  <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none">
                    <span className="hidden sm:inline">
                      {userName || userEmail}
                    </span>
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
                  <div className="font-medium">{userName || userEmail}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {userRoles.join(", ")}
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
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </>
  );
}
