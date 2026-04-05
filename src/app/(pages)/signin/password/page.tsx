"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";

export default function PasswordSignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier") || "";
  const username = searchParams.get("username") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Display identifier: prefer username (already has @), else show identifier
  const displayIdentifier = username || identifier;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Use username for login (the API expects username field)
      const loginUsername = username || identifier;

      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid password");
        setIsLoading(false);
        return;
      }

      // Redirect to callback URL or profile
      const redirectTo = callbackUrl || "/profile";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Build the back link URL with callback preserved
  const buildBackUrl = () => {
    const params = new URLSearchParams();
    if (identifier) params.set("email", identifier);
    if (callbackUrl) params.set("callbackUrl", callbackUrl);
    const queryString = params.toString();
    return queryString ? `/signin?${queryString}` : "/signin";
  };

  return (
    <div className="lg:min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-neutral-800 p-8 rounded-xl border border-neutral-700">
        <div className="flex justify-center items-center w-full">
          <div className="w-40 text-neutral-300">
            <AnimatedEndemitLogo />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">Enter Password</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Signing in as{" "}
            <span className="font-medium text-neutral-200">
              {displayIdentifier}
            </span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none relative block w-full px-4 py-3 border border-neutral-600 placeholder-neutral-500 text-white bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/50 border border-red-800 p-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href={buildBackUrl()}
              className="flex-shrink-0 py-3 px-4 border border-neutral-600 text-sm font-medium rounded-lg text-neutral-300 bg-neutral-700 hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors"
            >
              Back
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
