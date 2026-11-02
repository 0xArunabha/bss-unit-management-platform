"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      backgroundColor: "#f5f3ea",
      fontFamily: "var(--font-sans, system-ui, sans-serif)",
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        backgroundColor: "#ffffff",
        border: "1px solid #e0ded4",
        borderRadius: "8px",
        padding: "32px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        textAlign: "center",
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <AlertCircle size={24} />
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1c1917", marginBottom: "8px" }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: "14px", color: "#57534e", lineHeight: "1.5", marginBottom: "24px" }}>
          The unit management platform encountered an unexpected error. Please reload the view or return to the overview.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              backgroundColor: "#1c1917",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} />
            Try again
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 18px",
              backgroundColor: "#f5f3ea",
              color: "#1c1917",
              fontSize: "14px",
              fontWeight: "600",
              borderRadius: "6px",
              border: "1px solid #e0ded4",
              cursor: "pointer",
            }}
          >
            Reload workspace
          </button>
        </div>
      </div>
    </div>
  );
}
