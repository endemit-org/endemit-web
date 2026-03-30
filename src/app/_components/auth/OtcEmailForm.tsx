"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import { requestOtcCode } from "@/domain/auth/actions/requestOtcCode";
import { registerOtcUser } from "@/domain/auth/actions/registerOtcUser";

export default function OtcEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [showPasswordSignIn, setShowPasswordSignIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isNewAccount) {
        // Register new account and send OTC
        const result = await registerOtcUser({ email });

        if (result.success) {
          router.push(`/signin/verify?email=${encodeURIComponent(email)}`);
        } else {
          setError(
            result.error || "Failed to create account. Please try again."
          );
          setIsNewAccount(false);
        }
      } else {
        // Try to send OTC to existing account
        const result = await requestOtcCode({ email });

        if (result.success) {
          router.push(`/signin/verify?email=${encodeURIComponent(email)}`);
        } else if (result.error === "NO_ACCOUNT") {
          // Change button to registration mode
          setIsNewAccount(true);
        } else if (result.error === "WRONG_AUTH_METHOD") {
          setShowPasswordSignIn(true);
          setError("This account uses password sign-in.");
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Reset to normal mode when email changes
    if (isNewAccount) {
      setIsNewAccount(false);
    }
    if (showPasswordSignIn) {
      setShowPasswordSignIn(false);
      setError("");
    }
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
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`appearance-none relative block w-full px-4 py-3 border placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isNewAccount
                  ? "border-neutral-700 text-neutral-400 bg-neutral-800 cursor-not-allowed"
                  : "border-neutral-600 text-white bg-neutral-700"
              }`}
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading || isNewAccount}
            />
          </div>

          {isNewAccount && !error && (
            <div className="rounded-lg bg-blue-900/50 border border-blue-800 p-4">
              <p className="text-sm text-blue-200">
                We&apos;ll create an account for{" "}
                <span className="font-medium">{email}</span> and send you a
                sign-in code.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-900/50 border border-red-800 p-4">
              <p className="text-sm text-red-200">{error}</p>
              {showPasswordSignIn && (
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
