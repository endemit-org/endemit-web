"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import AnimatedSuccessIcon from "@/app/_components/icon/AnimatedSuccessIcon";
import { requestOtcCode } from "@/domain/auth/actions/requestOtcCode";

interface OtcVerifyFormProps {
  email: string;
  error?: string;
}

export default function OtcVerifyForm({
  email,
  error: initialError,
}: OtcVerifyFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState(initialError || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow alphanumeric characters
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (sanitized.length <= 1) {
      const newCode = [...code];
      newCode[index] = sanitized;
      setCode(newCode);

      // Auto-advance to next input
      if (sanitized && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 4 characters are entered
      if (sanitized && index === 3 && newCode.every(c => c)) {
        handleSubmit(newCode.join(""));
      }
    } else if (sanitized.length === 4) {
      // Handle paste of full code
      const chars = sanitized.split("");
      setCode(chars);
      inputRefs.current[3]?.focus();
      handleSubmit(sanitized);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join("");
    if (codeToVerify.length !== 4) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/otc/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeToVerify }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        // Delay redirect to show success animation
        setTimeout(() => {
          router.push("/profile");
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || "Invalid code. Please try again.");
        setCode(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setResendSuccess(false);
    setIsResending(true);

    try {
      const result = await requestOtcCode({ email });
      if (result.success) {
        setResendSuccess(true);
        setResendCooldown(60);
        setCode(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.error || "Failed to resend code.");
      }
    } catch {
      setError("Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-neutral-800 p-8 rounded-xl border border-neutral-700">
        <div className="flex justify-center items-center w-full">
          <div className="w-40 text-neutral-300">
            <AnimatedEndemitLogo />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">Enter Your Code</h2>
          <p className="mt-2 text-sm text-neutral-400">
            We sent a code to <span className="text-white">{email}</span>
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="flex justify-center gap-3">
            {code.map((char, index) => (
              <input
                key={index}
                ref={el => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode={index < 2 ? "text" : "numeric"}
                maxLength={4}
                value={char}
                onChange={e => handleInputChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-14 h-16 text-center text-2xl font-mono font-bold uppercase bg-neutral-700 border border-neutral-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                autoComplete="off"
              />
            ))}
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/50 border border-red-800 p-4">
              <p className="text-sm text-red-200 text-center">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="rounded-lg bg-green-900/50 border border-green-800 p-4">
              <p className="text-sm text-green-200 text-center">
                A new code has been sent to your email.
              </p>
            </div>
          )}

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-4">
              <AnimatedSuccessIcon className="w-16 h-16" />
              <p className="mt-4 text-sm text-green-400">
                Signed in successfully!
              </p>
            </div>
          ) : (
            <>
              <button
                type="submit"
                disabled={isLoading || code.some(c => !c)}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Verifying..." : "Sign In"}
              </button>

              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending
                    ? "Sending..."
                    : resendCooldown > 0
                      ? `Resend code (${resendCooldown}s)`
                      : "Resend code"}
                </button>

                <div>
                  <Link
                    href="/signin"
                    className="text-sm text-neutral-400 hover:text-neutral-300"
                  >
                    Use a different email
                  </Link>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
