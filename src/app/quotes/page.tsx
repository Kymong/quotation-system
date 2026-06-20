"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import type { QuoteStatus } from "@/lib/mockData";

const statusConfig: Record<QuoteStatus, { bg: string; text: string; dot: string }> = {
  Draft: { bg: "#1e2238", text: "#8892b0", dot: "#4a5568" },
  Sent: { bg: "#1a2a4a", text: "#60a5fa", dot: "#3b82f6" },
  Accepted: { bg: "#0f2a1e", text: "#34d399", dot: "#10b981" },
  Rejected: { bg: "#2a1018", text: "#f87171", dot: "#ef4444" },
};

type Filter = "all" | QuoteStatus;
const FILTERS: Filter[] = ["all", "Draft", "Sent", "Accepted", "Rejected"];

export default function QuotesPage() {
  const { quotes } = useAppContext();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const sorted = useMemo(
    () => [...quotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [quotes]
  );

  const filtered = useMemo(
    () => (activeFilter === "all" ? sorted : sorted.filter((q) => q.status === activeFilter)),
    [sorted, activeFilter]
  );

  const counts: Record<Filter, number> = {
    all: quotes.length,
    Draft: quotes.filter((q) => q.status === "Draft").length,
    Sent: quotes.filter((q) => q.status === "Sent").length,
    Accepted: quotes.filter((q) => q.status === "Accepted").length,
    Rejected: quotes.filter((q) => q.status === "Rejected").length,
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Quote Records
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {quotes.length} {quotes.length === 1 ? "quote" : "quotes"} total
          </p>
        </div>
        <a
          href="/quotes/create"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "var(--accent)", color: "white" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Quote
        </a>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: isActive ? "var(--accent)" : "var(--bg-card)",
                color: isActive ? "white" : "var(--text-secondary)",
                border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                cursor: "pointer",
              }}
            >
              {f !== "all" && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.7)" : statusConfig[f].dot }}
                />
              )}
              <span>{f === "all" ? "All" : f}</span>
              <span
                className="ml-0.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "var(--bg-hover)",
                  color: isActive ? "white" : "var(--text-muted)",
                }}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No {activeFilter === "all" ? "" : activeFilter.toLowerCase() + " "}quotes found.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Quote No.", "Customer", "Items", "Total", "Status", "Created", ""].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => (
                <tr
                  key={q.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: "var(--accent)" }}>
                    {q.quoteNumber}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {q.customerName}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {q.items.length} {q.items.length === 1 ? "item" : "items"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    ${q.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: statusConfig[q.status].bg,
                        color: statusConfig[q.status].text,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: statusConfig[q.status].dot }}
                      />
                      {q.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {q.createdAt}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <a
                        href={`/quotes/${q.id}`}
                        className="text-xs px-3 py-1.5 rounded-md"
                        style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-hover)" }}
                      >
                        View
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
