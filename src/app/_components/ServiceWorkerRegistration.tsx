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
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
      if (window.caches) {
        caches.keys().then(keys =>
          Promise.all(
            keys
              .filter(key => key.startsWith("endemit-"))
              .map(key => caches.delete(key))
          )
        );
      }
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

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available - activate it immediately
              newWorker.postMessage("skipWaiting");
            }
          });
        });

        // Reload page when new SW takes over
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

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
