"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        const redirectTo = window.location.pathname || "";

        router.push(
          `/signin${redirectTo ? `?callbackUrl=${encodeURIComponent(redirectTo)}` : ""}`
        );
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full text-left"
    >
      Sign out
    </button>
  );
}
