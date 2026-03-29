"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileButtonProps {
  user: {
    name: string | null;
    email: string | null;
    roles: string[];
  } | null;
  variant?: "compact" | "detailed";
  onOpen?: () => void;
}

export default function ProfileButton({ user, variant = "compact", onOpen }: ProfileButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  // Not logged in - show sign in button/icon
  if (!user) {
    if (variant === "compact") {
      return (
        <Link
          href="/signin"
          className="flex h-14 items-center px-3 text-gray-100 hover:text-gray-400"
          title="Sign In"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>
      );
    }

    return (
      <Link
        href="/signin"
        className="flex items-center justify-end gap-2 text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2"
      >
        <span>Sign In</span>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </Link>
    );
  }

  // Logged in - show profile icon with checkmark
  if (variant === "compact") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            const willOpen = !isOpen;
            setIsOpen(willOpen);
            if (willOpen && onOpen) {
              onOpen();
            }
          }}
          className="flex h-14 items-center px-3 text-gray-100 hover:text-gray-400"
          title={user.name || user.email || "Profile"}
        >
          <div className="relative">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-neutral-700">
              <p className="font-medium text-white truncate">
                {user.name || user.email}
              </p>
              {user.name && user.email && (
                <p className="text-sm text-neutral-400 truncate">{user.email}</p>
              )}
              {user.roles.length > 0 && (
                <p className="text-xs text-neutral-500 mt-1">
                  {user.roles.join(", ")}
                </p>
              )}
            </div>
            <div className="p-2">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-neutral-700 rounded-md disabled:opacity-50"
              >
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Detailed variant (for desktop sidebar)
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2 w-full min-w-0"
      >
        <div className="relative">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <span className="truncate min-w-0 flex-1">{user.name || user.email}</span>
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-neutral-700">
            <p className="font-medium text-white truncate">
              {user.name || user.email}
            </p>
            {user.name && user.email && (
              <p className="text-sm text-neutral-400 truncate">{user.email}</p>
            )}
            {user.roles.length > 0 && (
              <p className="text-xs text-neutral-500 mt-1">
                {user.roles.join(", ")}
              </p>
            )}
          </div>
          <div className="p-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-neutral-700 rounded-md disabled:opacity-50"
            >
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
