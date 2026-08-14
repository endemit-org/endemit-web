"use client";

import { useEffect } from "react";

/**
 * Root error boundary (replaces Next's unstyled white "Application error"
 * page). Its main job is self-healing the stale-deployment crash: old cached
 * HTML requesting chunk URLs that no longer exist (typical on old-iOS PWAs
 * after a deploy) throws a chunk-load error — we unregister the service
 * worker, drop our caches and reload once, which pulls a coherent fresh
 * deployment. Guarded to a single attempt per session so it can never loop.
 *
 * No i18n/theme providers exist at this level, so copy is hardcoded in both
 * languages and styles are inline.
 */

const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading chunk|error loading dynamically imported module|Importing a module script failed/i;

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    const isChunkError = CHUNK_ERROR_PATTERN.test(
      `${error?.name ?? ""} ${error?.message ?? ""}`
    );
    if (!isChunkError) return;

    try {
      if (sessionStorage.getItem("chunk-error-recovered") === "1") return;
      sessionStorage.setItem("chunk-error-recovered", "1");
    } catch {
      // No sessionStorage → no loop guard → don't auto-reload.
      return;
    }

    (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(reg => reg.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter(key => key.startsWith("endemit-"))
              .map(key => caches.delete(key))
          );
        }
      } catch {
        // Best effort — reload regardless.
      }
      window.location.reload();
    })();
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#e5e5e5",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "24rem" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p
            style={{
              color: "#a3a3a3",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            Nekaj je šlo narobe. Poskusi znova.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload · Osveži
          </button>
        </div>
      </body>
    </html>
  );
}
