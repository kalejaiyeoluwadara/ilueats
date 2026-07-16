"use client";

import { useEffect, useState } from "react";
import { isChunkLoadError, recoverFromChunkError } from "@/lib/chunkErrors";

/**
 * Last resort: the root layout itself failed, so this renders its own document
 * and cannot rely on fonts, providers, or globals.css being available.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [recovering] = useState(
    () => isChunkLoadError(error) && recoverFromChunkError()
  );

  useEffect(() => {
    if (!recovering) console.error(error);
  }, [error, recovering]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#fff",
          color: "#171412",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
        }}
      >
        {recovering ? null : (
          <main>
            <div style={{ fontSize: "56px" }}>🍳</div>
            <h1
              style={{
                margin: "16px 0 0",
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                margin: "8px auto 0",
                maxWidth: "360px",
                fontSize: "14px",
                lineHeight: 1.5,
                color: "#6b6560",
              }}
            >
              IluEats hit an unexpected error. Reloading usually sorts it out.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "24px",
                padding: "12px 28px",
                fontSize: "15px",
                fontWeight: 600,
                color: "#fff",
                background: "#e64e0e",
                border: "none",
                borderRadius: "999px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </main>
        )}
      </body>
    </html>
  );
}
