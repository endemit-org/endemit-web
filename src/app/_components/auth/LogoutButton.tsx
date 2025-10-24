"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        const redirectTo = window.location.pathname || "";

        router.push(
          `/auth/sign-in${redirectTo ? `?redirect=${redirectTo}` : ""}`
        );
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return <span onClick={handleLogout}>Sign out</span>;
}
