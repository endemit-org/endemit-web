"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import { requestOtcCode } from "@/domain/auth/actions/requestOtcCode";
import { registerOtcUser } from "@/domain/auth/actions/registerOtcUser";

// Validation helpers
const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isValidUsername = (value: string): boolean => {
  // Username without @, alphanumeric and underscore, 2-30 chars
  return /^[a-zA-Z0-9_]{2,30}$/.test(value);
};

const isUsernameFormat = (value: string): boolean => {
  return value.startsWith("@");
};

const validateIdentifier = (
  value: string
): { valid: boolean; error?: string } => {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, error: "Please enter your @username or email" };
  }

  if (isUsernameFormat(trimmed)) {
    const username = trimmed.slice(1);
    if (!isValidUsername(username)) {
      return {
        valid: false,
        error:
          "Username must be 2-30 characters (letters, numbers, underscore)",
      };
    }
    return { valid: true };
  }

  if (!isValidEmail(trimmed)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  return { valid: true };
};

export default function OtcEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIdentifier = searchParams.get("email") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate input
    const validation = validateIdentifier(identifier);
    if (!validation.valid) {
      setError(validation.error || "Invalid input");
      return;
    }

    setIsLoading(true);

    try {
      const trimmedIdentifier = identifier.trim();
      const isUsername = isUsernameFormat(trimmedIdentifier);

      if (isNewAccount) {
        // Register new account with email (registration only works with email)
        if (isUsername) {
          setError("Please use an email address to create a new account");
          setIsLoading(false);
          return;
        }

        const result = await registerOtcUser({ email: trimmedIdentifier });

        if (result.success) {
          const verifyParams = new URLSearchParams({
            email: trimmedIdentifier,
          });
          if (callbackUrl) verifyParams.set("callbackUrl", callbackUrl);
          router.push(`/signin/verify?${verifyParams.toString()}`);
        } else {
          setError(
            result.error || "Failed to create account. Please try again."
          );
          setIsNewAccount(false);
        }
      } else {
        // Check auth mode first
        const response = await fetch("/api/v1/auth/check-mode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: trimmedIdentifier }),
        });

        const authModeResult = await response.json();

        if (!authModeResult.exists) {
          // No account found
          if (isUsername) {
            setError("No account found with this username");
          } else {
            // Allow registration for email
            setIsNewAccount(true);
          }
          setIsLoading(false);
          return;
        }

        if (!authModeResult.authMode) {
          // Account exists but inactive
          setError("Account is not active");
          setIsLoading(false);
          return;
        }

        if (authModeResult.authMode === "PASSWORD") {
          // Redirect to password sign-in
          const params = new URLSearchParams();
          params.set("identifier", trimmedIdentifier);
          if (authModeResult.username) {
            params.set("username", authModeResult.username);
          }
          if (callbackUrl) params.set("callbackUrl", callbackUrl);
          router.push(`/signin/password?${params.toString()}`);
          return;
        }

        // OTC auth - send code
        const email = authModeResult.email || trimmedIdentifier;
        const result = await requestOtcCode({ email });

        if (result.success) {
          const verifyParams = new URLSearchParams({ email });
          if (callbackUrl) verifyParams.set("callbackUrl", callbackUrl);
          router.push(`/signin/verify?${verifyParams.toString()}`);
        } else {
          setError(result.error || "Failed to send code. Please try again.");
        }
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value);
    // Reset to normal mode when identifier changes
    if (isNewAccount) {
      setIsNewAccount(false);
    }
    if (error) {
      setError("");
    }
  };

  const isUsername = isUsernameFormat(identifier.trim());

  return (
    <div className="lg:min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-neutral-800 p-8 rounded-xl border border-neutral-700">
        <div className="flex justify-center items-center w-full">
          <div className="w-40 text-neutral-300">
            <AnimatedEndemitLogo />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">
            {isNewAccount ? "Create Account" : "Sign In"}
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            {isNewAccount
              ? "No account found. Click below to create one."
              : `Enter your email and we'll send you a code to sign in.\n
              No passwords, no registrations, it just works!`}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="identifier" className="sr-only">
              Username or Email
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username email"
              required
              className={`appearance-none relative block w-full px-4 py-3 border placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isNewAccount
                  ? "border-neutral-700 text-neutral-400 bg-neutral-800 cursor-not-allowed"
                  : "border-neutral-600 text-white bg-neutral-700"
              }`}
              placeholder="Enter your email"
              value={identifier}
              onChange={handleIdentifierChange}
              disabled={isLoading || isNewAccount}
            />
          </div>

          {isNewAccount && !error && (
            <div className="rounded-lg bg-blue-900/50 border border-blue-800 p-4">
              <p className="text-sm text-blue-200">
                We&apos;ll create an account for{" "}
                <span className="font-medium">{identifier}</span> and send you a
                sign-in code.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-900/50 border border-red-800 p-4">
              <p className="text-sm text-red-200">{error}</p>
              {error.includes("password") && (
                <div className="mt-3">
                  <Link
                    href="/auth/sign-in"
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Sign in with password
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className={isNewAccount ? "flex gap-3" : ""}>
            {isNewAccount && (
              <button
                type="button"
                onClick={() => {
                  setIsNewAccount(false);
                  setError("");
                }}
                disabled={isLoading}
                className="flex-shrink-0 py-3 px-4 border border-neutral-600 text-sm font-medium rounded-lg text-neutral-300 bg-neutral-700 hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                isNewAccount
                  ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              }`}
            >
              {isLoading
                ? isNewAccount
                  ? "Creating account..."
                  : isUsername
                    ? "Checking..."
                    : "Sending code..."
                : isNewAccount
                  ? "Register this email"
                  : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
