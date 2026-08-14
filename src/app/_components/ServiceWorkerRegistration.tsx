"use client";

import { useEffect } from "react";

/**
 * Service Worker registration component.
 * Registers the SW with deployment ID for cache versioning.
 * Mount this in the root layout.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // In development, ensure no stale SW is left controlling the page. A dev SW
    // caches `/_next/static/` chunks cache-first under a constant `dev` cache
    // key, so after any code change it serves stale JS against freshly built
    // HTML — causing hydration mismatches that only a hard refresh clears.
    if (process.env.NODE_ENV !== "production") {
      const hadController = !!navigator.serviceWorker.controller;
      Promise.all([
        navigator.serviceWorker
          .getRegistrations()
          .then(regs => Promise.all(regs.map(r => r.unregister()))),
        window.caches
          ? caches
              .keys()
              .then(keys =>
                Promise.all(
                  keys
                    .filter(key => key.startsWith("endemit-"))
                    .map(key => caches.delete(key))
                )
              )
          : Promise.resolve(),
      ]).then(() => {
        // If a stale SW was still controlling this page, reload once so we get
        // fresh (uncached) chunks — otherwise this page keeps the old JS.
        if (hadController && !sessionStorage.getItem("sw-dev-cleaned")) {
          sessionStorage.setItem("sw-dev-cleaned", "1");
          window.location.reload();
        }
      });
      return;
    }

    const deploymentId =
      process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID ||
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
      "dev";

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          `/sw.js?v=${deploymentId}`,
          { scope: "/" }
        );

        // Check for updates periodically (every 60 seconds)
        setInterval(() => {
          registration.update();
        }, 60 * 1000);

        // Deliberately NO skipWaiting/controllerchange-reload here: forcing
        // the new SW to take over mid-session reloaded the page under the
        // user (wiping login/checkout form state) and let the new SW purge
        // the old deployment's caches while stale HTML still referenced its
        // chunks (ChunkLoadError → white error page on old iOS). The new SW
        // simply waits and activates on the next app start; VersionChecker
        // handles bringing long-lived sessions forward.
        console.log("[SW] Registered successfully");
      } catch (error) {
        console.error("[SW] Registration failed:", error);
      }
    };

    // Register after page load to not block rendering
    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);
      return () => window.removeEventListener("load", registerServiceWorker);
    }
  }, []);

  return null;
}
