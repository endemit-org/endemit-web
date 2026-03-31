"use client";

import Link from "next/link";
import UserIcon from "@/app/_components/icon/UserIcon";
import { useCurrentUser } from "@/app/_hooks/useCurrentUser";

interface ProfileButtonProps {
  variant?: "compact" | "detailed";
}

export default function ProfileButton({
  variant = "compact",
}: ProfileButtonProps) {
  const { user, isLoading } = useCurrentUser();

  // Compact variant (mobile header)
  if (variant === "compact") {
    return (
      <div
        className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
      >
        {!user ? (
          <Link
            href="/signin"
            className="flex h-14 items-center px-3 text-gray-100 hover:text-gray-400"
            title="Sign In"
          >
            <UserIcon className="w-6 h-6" />
          </Link>
        ) : (
          <Link
            href="/profile"
            className="flex h-14 items-center px-3 text-gray-100 hover:text-gray-400"
            title={user.name || user.email || "Profile"}
          >
            <div className="relative">
              <UserIcon className="w-6 h-6" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-2 h-2 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Link>
        )}
      </div>
    );
  }

  // Detailed variant (desktop sidebar)
  return (
    <div
      className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
    >
      {!user ? (
        <Link
          href="/signin"
          className="flex items-center justify-end gap-2 text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2"
        >
          <span>Sign In</span>
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </Link>
      ) : (
        <Link
          href="/profile"
          className="flex items-center justify-end gap-2 text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2"
        >
          <span className="truncate">
            {user.name || user.email}
          </span>
          <div className="relative flex-shrink-0">
            <svg
              className="w-8 h-8 text-neutral-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-2 h-2 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
