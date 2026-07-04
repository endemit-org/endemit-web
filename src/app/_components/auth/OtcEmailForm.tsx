"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
): {
  valid: boolean;
  errorKey?:
    | "emailForm.errors.identifierRequired"
    | "emailForm.errors.usernameInvalid"
    | "emailForm.errors.emailInvalid";
} => {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, errorKey: "emailForm.errors.identifierRequired" };
  }

  if (isUsernameFormat(trimmed)) {
    const username = trimmed.slice(1);
    if (!isValidUsername(username)) {
      return {
        valid: false,
        errorKey: "emailForm.errors.usernameInvalid",
      };
    }
    return { valid: true };
  }

  if (!isValidEmail(trimmed)) {
    return { valid: false, errorKey: "emailForm.errors.emailInvalid" };
  }

  return { valid: true };
};

const fetchAuthMode = async (identifier: string) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("/api/v1/auth/check-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const result = await response.json();
      if (response.ok && typeof result.exists === "boolean") {
        return result;
      }
    } catch {
      // Swallow fetch/JSON errors so the retry can run.
    }
    if (attempt === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return null;
};

export default function OtcEmailForm() {
  const t = useTranslations("signin");
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
      setError(t(validation.errorKey ?? "emailForm.errors.identifierRequired"));
      return;
    }

    setIsLoading(true);

    try {
      const trimmedIdentifier = identifier.trim();
      const isUsername = isUsernameFormat(trimmedIdentifier);

      if (isNewAccount) {
        // Register new account with email (registration only works with email)
        if (isUsername) {
          setError(t("emailForm.errors.usernameCantRegister"));
          setIsLoading(false);
          return;
        }

        const result = await registerOtcUser({
          email: trimmedIdentifier,
          callbackUrl: callbackUrl || undefined,
        });

        if (result.success) {
          const verifyParams = new URLSearchParams({
            email: trimmedIdentifier,
          });
          if (callbackUrl) verifyParams.set("callbackUrl", callbackUrl);
          router.push(`/signin/verify?${verifyParams.toString()}`);
        } else {
          setError(result.error || t("emailForm.errors.createFailed"));
          setIsNewAccount(false);
          setIsLoading(false);
        }
      } else {
        const authModeResult = await fetchAuthMode(trimmedIdentifier);

        if (!authModeResult) {
          setError(t("errors.somethingWrong"));
          setIsLoading(false);
          return;
        }

        if (!authModeResult.exists) {
          // No account found
          if (isUsername) {
            setError(t("emailForm.errors.noAccountUsername"));
          } else {
            // Allow registration for email
            setIsNewAccount(true);
          }
          setIsLoading(false);
          return;
        }

        if (!authModeResult.authMode) {
          // Account exists but inactive
          setError(t("emailForm.errors.inactive"));
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
        const result = await requestOtcCode({
          email,
          callbackUrl: callbackUrl || undefined,
        });

        if (result.success) {
          const verifyParams = new URLSearchParams({ email });
          if (callbackUrl) verifyParams.set("callbackUrl", callbackUrl);
          router.push(`/signin/verify?${verifyParams.toString()}`);
        } else {
          setError(result.error || t("emailForm.errors.sendFailed"));
          setIsLoading(false);
        }
      }
    } catch {
      setError(t("errors.generic"));
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
            {isNewAccount ? t("emailForm.createTitle") : t("signIn")}
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            {isNewAccount
              ? t("emailForm.createSubtitle")
              : t("emailForm.subtitle")}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="identifier" className="sr-only">
              {t("emailForm.label")}
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
              placeholder={t("emailForm.placeholder")}
              value={identifier}
              onChange={handleIdentifierChange}
              disabled={isLoading || isNewAccount}
            />
          </div>

          {isNewAccount && !error && (
            <div className="rounded-lg bg-blue-900/50 border border-blue-800 p-4">
              <p className="text-sm text-blue-200">
                {t("emailForm.createConfirm", { identifier })}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-900/50 border border-red-800 p-4">
              <p className="text-sm text-red-200">{error}</p>
              {error.includes("password") && (
                <div className="mt-3">
                  <Link
                    href="/signin/password"
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    {t("emailForm.signInWithPassword")}
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
                {t("back")}
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
                  ? t("emailForm.creatingAccount")
                  : isUsername
                    ? t("emailForm.checking")
                    : t("emailForm.sendingCode")
                : isNewAccount
                  ? t("emailForm.registerEmail")
                  : t("emailForm.continue")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
