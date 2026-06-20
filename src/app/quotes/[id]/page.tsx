"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import type { QuoteStatus } from "@/lib/mockData";
import { sendQuoteEmail } from "./actions";

const statusConfig: Record<QuoteStatus, { bg: string; text: string; dot: string }> = {
  Draft:    { bg: "#1e2238", text: "#8892b0",  dot: "#4a5568" },
  Sent:     { bg: "#1a2a4a", text: "#60a5fa",  dot: "#3b82f6" },
  Accepted: { bg: "#0f2a1e", text: "#34d399",  dot: "#10b981" },
  Rejected: { bg: "#2a1018", text: "#f87171",  dot: "#ef4444" },
};

export default function QuoteDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { quotes, customers, loading, updateQuoteStatus } = useAppContext();

  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  const quote = quotes.find((q) => q.id === id);
  const customer = quote ? customers.find((c) => c.id === quote.customerId) : undefined;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Quote not found.</p>
        <button
          onClick={() => router.push("/quotes")}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          ← Back to Records
        </button>
      </div>
    );
  }

  const cfg = statusConfig[quote.status];
  const canSend = quote.status === "Draft" || quote.status === "Sent";
  const hasEmail = !!customer?.email;

  async function handleSendQuote() {
    if (!quote) return;
    setSendResult(null);
    setSending(true);
    try {
      const { error } = await sendQuoteEmail(quote.id);
      if (error) throw new Error(error);
      await updateQuoteStatus(quote.id, "Sent");
      setSendResult({ ok: true, message: `Quote sent to ${customer?.email}` });
    } catch (err: unknown) {
      setSendResult({ ok: false, message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Back + header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/quotes")}
          className="flex items-center gap-1.5 text-sm mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Records
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
                {quote.quoteNumber}
              </h1>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: cfg.bg, color: cfg.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: cfg.dot }} />
                {quote.status}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Created {quote.createdAt} · Updated {quote.updatedAt}
            </p>
          </div>

          {/* Send button */}
          {canSend && (
            <button
              onClick={handleSendQuote}
              disabled={sending || !hasEmail}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
              style={{
                backgroundColor: sending ? "var(--bg-hover)" : "var(--accent)",
                color: sending ? "var(--text-muted)" : "white",
                opacity: !hasEmail ? 0.5 : 1,
                cursor: !hasEmail ? "not-allowed" : "pointer",
              }}
              title={!hasEmail ? "Customer has no email address" : undefined}
            >
              {sending ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  {quote.status === "Sent" ? "Resend Quote" : "Send Quote"}
                </>
              )}
            </button>
          )}
        </div>

        {/* Send result banner */}
        {sendResult && (
          <div
            className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: sendResult.ok ? "#0f2a1e" : "#2a1018",
              border: `1px solid ${sendResult.ok ? "#10b981" : "#ef4444"}`,
              color: sendResult.ok ? "#34d399" : "#f87171",
            }}
          >
            {sendResult.ok ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {sendResult.message}
          </div>
        )}

        {!hasEmail && canSend && (
          <div
            className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: "#1e1a0a", border: "1px solid #78350f", color: "#fbbf24" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Customer has no email address.{" "}
            <a href="/customers" style={{ color: "#fbbf24", textDecoration: "underline" }}>
              Add one in Customers →
            </a>
          </div>
        )}
      </div>

      {/* Customer card */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Customer
        </p>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
            style={{ width: "36px", height: "36px", backgroundColor: "#1e2a4a", color: "var(--accent)" }}
          >
            {quote.customerName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {quote.customerName}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {customer?.contact}
              {customer?.email ? ` · ${customer.email}` : " · No email"}
              {customer?.phone ? ` · ${customer.phone}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div
        className="rounded-xl overflow-hidden mb-5"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Line Items
          </p>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Description", "Qty", "Unit Price", "Subtotal"].map((h) => (
                <th
                  key={h}
                  className={`px-6 py-3 text-xs font-medium uppercase tracking-wider ${h !== "Description" ? "text-right" : "text-left"}`}
                  style={{ color: "var(--text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, i) => (
              <tr
                key={item.id}
                style={{ borderBottom: i < quote.items.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <td className="px-6 py-4 text-sm" style={{ color: "var(--text-primary)" }}>
                  {item.description}
                </td>
                <td className="px-6 py-4 text-sm text-right" style={{ color: "var(--text-secondary)" }}>
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-right" style={{ color: "var(--text-secondary)" }}>
                  ${item.unitPrice.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-right font-medium" style={{ color: "var(--text-primary)" }}>
                  ${(item.quantity * item.unitPrice).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          className="px-6 py-4 flex items-center justify-end gap-8"
          style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}
        >
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total</span>
          <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            ${quote.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Notes
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {quote.notes}
          </p>
        </div>
      )}
    </div>
  );
}
