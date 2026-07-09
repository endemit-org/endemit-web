"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { requestOtcCode } from "@/domain/auth/actions/requestOtcCode";
import { registerOtcUser } from "@/domain/auth/actions/registerOtcUser";
import type { SceneStatus, WristbandColor } from "./WristbandScene";

// three.js stage — client-only and heavy, so keep it out of the page bundle.
const WristbandScene = dynamic(() => import("./WristbandScene"), {
  ssr: false,
});

// The wristband code stays in the URL the whole time; after sign-in the page
// simply re-renders as authenticated and the link prompt picks it up from
// there — this component never needs it directly.

type Phase =
  | { kind: "intro" }
  | { kind: "email" }
  | { kind: "confirmNew"; email: string }
  | { kind: "code"; email: string }
  | { kind: "password"; identifier: string; username: string | null }
  | { kind: "success" };

const panelSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// "@handle" identifiers — same rules as the signin page.
const isUsernameFormat = (value: string): boolean => value.startsWith("@");
const isValidUsername = (value: string): boolean =>
  /^[a-zA-Z0-9_]{2,30}$/.test(value);

/**
 * What a signed-out visitor sees after scanning a wristband QR: the band
 * rolling in, the three steps, then the whole email + code sign-in driven
 * inside this same modal. On success the page refreshes into the signed-in
 * state and the link prompt takes over.
 */
interface Props {
  /** Wristband color of the scanned code — null cycles the band's palette. */
  color?: WristbandColor | null;
  /** Normalized wristband code, shown in the center of the 3D band. */
  code?: string | null;
}

export default function WristbandIntro({
  color = null,
  code: bandCode = null,
}: Props) {
  const t = useTranslations("profile");
  const tSignin = useTranslations("signin");
  const router = useRouter();
  const reducedMotion = useReducedMotion() ?? false;

  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sceneStatus: SceneStatus =
    phase.kind === "success" ? "success" : "none";

  const goTo = useCallback((next: Phase) => {
    setError("");
    setIsLoading(false);
    setPhase(next);
  }, []);

  // Magic-link continuation: the emailed sign-in button must land back on
  // this exact URL (with ?paymentCode=) so the link prompt takes over.
  // autoLink=1 tells the prompt the user already committed to linking by
  // going through this flow — it links without asking again.
  const continueUrl = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("autoLink", "1");
    return `${window.location.pathname}?${params.toString()}`;
  };

  // ---- email step -------------------------------------------------------

  const submitEmail = useCallback(async () => {
    const identifier = emailInput.trim();
    const isUsername = isUsernameFormat(identifier);
    if (isUsername) {
      if (!isValidUsername(identifier.slice(1))) {
        setError(tSignin("emailForm.errors.usernameInvalid"));
        return;
      }
    } else if (!isValidEmail(identifier)) {
      setError(tSignin("emailForm.errors.emailInvalid"));
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/auth/check-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.exists !== "boolean") {
        setError(tSignin("errors.somethingWrong"));
        return;
      }

      if (!result.exists) {
        if (isUsername) {
          // Registration needs an email address.
          setError(tSignin("emailForm.errors.noAccountUsername"));
          return;
        }
        goTo({ kind: "confirmNew", email: identifier });
        return;
      }
      if (!result.authMode) {
        setError(tSignin("emailForm.errors.inactive"));
        return;
      }
      if (result.authMode === "PASSWORD") {
        goTo({
          kind: "password",
          identifier,
          username: result.username ?? null,
        });
        return;
      }

      // For @username sign-ins check-mode resolves the account's email.
      const email = result.email || identifier;
      const sent = await requestOtcCode({ email, callbackUrl: continueUrl() });
      if (sent.success) {
        goTo({ kind: "code", email });
      } else {
        setError(sent.error || tSignin("emailForm.errors.sendFailed"));
      }
    } catch {
      setError(tSignin("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }, [emailInput, goTo, tSignin]);

  const confirmRegister = useCallback(async () => {
    if (phase.kind !== "confirmNew") return;
    setError("");
    setIsLoading(true);
    try {
      const result = await registerOtcUser({
        email: phase.email,
        callbackUrl: continueUrl(),
      });
      if (result.success) {
        goTo({ kind: "code", email: phase.email });
      } else {
        setError(result.error || tSignin("emailForm.errors.createFailed"));
      }
    } catch {
      setError(tSignin("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }, [phase, goTo, tSignin]);

  // ---- password step ----------------------------------------------------

  const [password, setPassword] = useState("");

  useEffect(() => {
    if (phase.kind !== "password") return;
    setPassword("");
  }, [phase.kind]);

  const submitPassword = useCallback(async () => {
    if (phase.kind !== "password" || !password) return;
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The API expects the username; fall back to the raw identifier
          // exactly like the dedicated password page does.
          username: phase.username || phase.identifier,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || tSignin("errors.generic"));
        return;
      }
      setPhase({ kind: "success" });
      setTimeout(() => router.replace(continueUrl()), 1200);
    } catch {
      setError(tSignin("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }, [phase, password, router, tSignin]);

  // ---- code step --------------------------------------------------------

  const [code, setCode] = useState(["", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (phase.kind !== "code") return;
    setCode(["", "", "", ""]);
    setResendCooldown(60);
    inputRefs.current[0]?.focus();
  }, [phase.kind]);

  useEffect(() => {
    if (phase.kind !== "code" || resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(v => v - 1), 1000);
    return () => clearInterval(timer);
  }, [phase.kind, resendCooldown]);

  const verifyCode = useCallback(
    async (fullCode: string) => {
      if (phase.kind !== "code" || fullCode.length !== 4) return;
      setError("");
      setIsLoading(true);
      try {
        const response = await fetch("/api/v1/auth/otc/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: phase.email, code: fullCode }),
        });
        const result = await response.json();
        if (result.success) {
          setPhase({ kind: "success" });
          // Give the check in the band a beat, then re-render the page as
          // signed-in (with autoLink=1): this modal unmounts and the link
          // prompt links the band without asking again.
          setTimeout(() => router.replace(continueUrl()), 1200);
        } else {
          setError(result.error || tSignin("verify.invalidCode"));
          setCode(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      } catch {
        setError(tSignin("errors.generic"));
      } finally {
        setIsLoading(false);
      }
    },
    [phase, router, tSignin]
  );

  const handleCodeChange = (index: number, value: string) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (sanitized.length <= 1) {
      const next = [...code];
      next[index] = sanitized;
      setCode(next);
      if (sanitized && index < 3) inputRefs.current[index + 1]?.focus();
      if (sanitized && index === 3 && next.every(c => c)) {
        verifyCode(next.join(""));
      }
    } else if (sanitized.length === 4) {
      setCode(sanitized.split(""));
      inputRefs.current[3]?.focus();
      verifyCode(sanitized);
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendCode = useCallback(async () => {
    if (phase.kind !== "code" || resendCooldown > 0) return;
    setError("");
    setIsResending(true);
    try {
      const result = await requestOtcCode({
        email: phase.email,
        callbackUrl: continueUrl(),
      });
      if (result.success) {
        setResendCooldown(60);
        setCode(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.error || tSignin("verify.resendFailed"));
      }
    } catch {
      setError(tSignin("verify.resendFailed"));
    } finally {
      setIsResending(false);
    }
  }, [phase, resendCooldown, tSignin]);

  // ---- render -----------------------------------------------------------

  // Scanning the QR is what got them here — that step is already done, and
  // it's the big one: it gets double weight in both the bar and the percent
  // so the three remaining steps read as smaller fills.
  const steps = [
    { label: t("wristband.intro.step0"), done: true, weight: 2 },
    { label: t("wristband.intro.step1"), done: false, weight: 1 },
    { label: t("wristband.intro.step2"), done: false, weight: 1 },
    { label: t("wristband.intro.step3"), done: false, weight: 1 },
  ];
  const totalWeight = steps.reduce((sum, s) => sum + s.weight, 0);
  const doneWeight = steps.reduce((sum, s) => sum + (s.done ? s.weight : 0), 0);
  const progressPercent = Math.round((doneWeight / totalWeight) * 100);

  const fade = {
    initial: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 8, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: -8, filter: "blur(4px)" },
    transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
        initial={
          reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }
        }
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={panelSpring}
      >
        {/* 3D stage */}
        <div className="relative h-48">
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 opacity-80"
            style={{
              background:
                "radial-gradient(55% 90% at 50% 100%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 55%, transparent 80%)",
            }}
          />
          <WristbandScene
            reducedMotion={reducedMotion}
            status={sceneStatus}
            color={color}
            label={bandCode}
            className="absolute inset-0"
          />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-neutral-900 to-transparent" />
        </div>

        <div className="px-6 pb-6 pt-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={phase.kind} {...fade}>
              {phase.kind === "intro" && (
                <div>
                  <p className="text-white text-lg font-semibold text-center mb-1">
                    {t("wristband.intro.title")}
                  </p>
                  <p className="text-neutral-400 text-sm text-center mb-5">
                    {t("wristband.intro.subtitle")}
                  </p>

                  {/* Scanning already happened, so they start 25% in. */}
                  <div className="mb-4">
                    <div className="flex items-center justify-end mb-1.5">
                      <span className="text-xs font-medium text-emerald-400">
                        {t("wristband.intro.progress", {
                          percent: progressPercent,
                        })}
                      </span>
                    </div>
                    {/* One segment per step; the scan segment is wider since
                        it's the big one already behind them, the remaining
                        three are smaller fills. */}
                    <div className="flex gap-1">
                      {steps.map((step, index) => (
                        <div
                          key={index}
                          className="h-1.5 bg-neutral-800 rounded-full overflow-hidden"
                          style={{ flexGrow: step.weight, flexBasis: 0 }}
                        >
                          <motion.div
                            className="h-full bg-emerald-500 rounded-full"
                            initial={
                              reducedMotion
                                ? { width: step.done ? "100%" : "0%" }
                                : { width: 0 }
                            }
                            animate={{ width: step.done ? "100%" : "0%" }}
                            transition={{
                              duration: 0.6,
                              delay: 0.3,
                              ease: [0.32, 0.72, 0, 1],
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.ol
                    className="space-y-2 mb-6"
                    initial={reducedMotion ? undefined : "hidden"}
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                          delayChildren: 0.25,
                        },
                      },
                    }}
                  >
                    {steps.map((step, index) => (
                      <motion.li
                        key={index}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left border ${
                          step.done
                            ? "bg-emerald-500/5 border-emerald-500/25 text-neutral-400"
                            : "bg-neutral-800/40 border-neutral-800 text-neutral-300"
                        }`}
                        variants={{
                          hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                            transition: {
                              duration: 0.3,
                              ease: [0.32, 0.72, 0, 1],
                            },
                          },
                        }}
                      >
                        <span
                          className={`shrink-0 w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
                            step.done
                              ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                              : "bg-neutral-700/70 text-neutral-200"
                          }`}
                        >
                          {step.done ? (
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </span>
                        {step.label}
                      </motion.li>
                    ))}
                  </motion.ol>
                  <button
                    onClick={() => goTo({ kind: "email" })}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors active:scale-[0.98]"
                  >
                    {t("wristband.intro.cta")}
                  </button>
                </div>
              )}

              {phase.kind === "email" && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    submitEmail();
                  }}
                >
                  <p className="text-white text-lg font-semibold text-center mb-1">
                    {t("wristband.intro.emailTitle")}
                  </p>
                  <p className="text-neutral-400 text-sm text-center mb-5">
                    {tSignin("emailForm.subtitle")}
                  </p>
                  <input
                    type="text"
                    autoComplete="username email"
                    autoFocus
                    required
                    placeholder={tSignin("emailForm.placeholder")}
                    value={emailInput}
                    onChange={e => {
                      setEmailInput(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-3 mb-3 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
                  />
                  {error && (
                    <p className="text-red-300 text-sm text-center mb-3">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        {isUsernameFormat(emailInput.trim())
                          ? tSignin("emailForm.checking")
                          : tSignin("emailForm.sendingCode")}
                      </span>
                    ) : (
                      tSignin("emailForm.continue")
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo({ kind: "intro" })}
                    disabled={isLoading}
                    className="mt-3 w-full text-center text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors"
                  >
                    {tSignin("back")}
                  </button>
                </form>
              )}

              {phase.kind === "confirmNew" && (
                <div className="text-center">
                  <p className="text-white text-lg font-semibold mb-1">
                    {tSignin("emailForm.createTitle")}
                  </p>
                  <p className="text-neutral-400 text-sm mb-5">
                    {tSignin("emailForm.createConfirm", {
                      identifier: phase.email,
                    })}
                  </p>
                  {error && (
                    <p className="text-red-300 text-sm mb-3">{error}</p>
                  )}
                  <button
                    onClick={confirmRegister}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        {tSignin("emailForm.creatingAccount")}
                      </span>
                    ) : (
                      tSignin("emailForm.registerEmail")
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo({ kind: "email" })}
                    disabled={isLoading}
                    className="mt-3 w-full text-center text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors"
                  >
                    {tSignin("back")}
                  </button>
                </div>
              )}

              {phase.kind === "code" && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    verifyCode(code.join(""));
                  }}
                >
                  <p className="text-white text-lg font-semibold text-center mb-1">
                    {tSignin("verify.title")}
                  </p>
                  <p className="text-neutral-400 text-sm text-center mb-5">
                    {tSignin("verify.sentTo")}{" "}
                    <span className="text-white">{phase.email}</span>
                  </p>
                  <div className="flex justify-center gap-2.5 mb-4">
                    {code.map((char, index) => (
                      <input
                        key={index}
                        ref={el => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        // Code format is 2 letters + 2 digits — numeric pad
                        // for the digit fields, same as the signin verify page.
                        inputMode={index < 2 ? "text" : "numeric"}
                        maxLength={4}
                        value={char}
                        onChange={e => handleCodeChange(index, e.target.value)}
                        onKeyDown={e => handleCodeKeyDown(index, e)}
                        disabled={isLoading}
                        autoComplete="off"
                        className="w-12 h-14 text-center text-xl font-mono font-bold uppercase bg-neutral-800 border border-neutral-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    ))}
                  </div>
                  {error && (
                    <p className="text-red-300 text-sm text-center mb-3">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || code.some(c => !c)}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        {tSignin("verify.verifying")}
                      </span>
                    ) : (
                      tSignin("signIn")
                    )}
                  </button>
                  <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                    <button
                      type="button"
                      onClick={resendCode}
                      disabled={isResending || resendCooldown > 0}
                      className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isResending
                        ? tSignin("verify.sending")
                        : resendCooldown > 0
                          ? tSignin("verify.resendCooldown", {
                              seconds: resendCooldown,
                            })
                          : tSignin("verify.resend")}
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo({ kind: "email" })}
                      className="text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      {tSignin("verify.differentEmail")}
                    </button>
                  </div>
                </form>
              )}

              {phase.kind === "password" && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    submitPassword();
                  }}
                >
                  <p className="text-white text-lg font-semibold text-center mb-1">
                    {tSignin("password.title")}
                  </p>
                  <p className="text-neutral-400 text-sm text-center mb-5">
                    {tSignin("password.signingInAs")}{" "}
                    <span className="text-white">
                      {phase.username || phase.identifier}
                    </span>
                  </p>
                  <input
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    required
                    placeholder={tSignin("password.placeholder")}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-3 mb-3 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
                  />
                  {error && (
                    <p className="text-red-300 text-sm text-center mb-3">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || !password}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        {tSignin("password.signingIn")}
                      </span>
                    ) : (
                      tSignin("signIn")
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo({ kind: "email" })}
                    disabled={isLoading}
                    className="mt-3 w-full text-center text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors"
                  >
                    {tSignin("back")}
                  </button>
                </form>
              )}

              {phase.kind === "success" && (
                <div className="text-center py-4">
                  <p className="text-white text-lg font-semibold mb-1">
                    {tSignin("verify.success")}
                  </p>
                  <p className="text-neutral-400 text-sm">
                    {t("wristband.checking")}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
    />
  );
}
