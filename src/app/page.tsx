"use client";

import { useAppContext } from "@/context/AppContext";

const statusColors: Record<string, { bg: string; text: string }> = {
  Draft:    { bg: "#1e2238", text: "#8892b0" },
  Sent:     { bg: "#1a2a4a", text: "#60a5fa" },
  Accepted: { bg: "#0f2a1e", text: "#34d399" },
  Rejected: { bg: "#2a1018", text: "#f87171" },
};

export default function DashboardPage() {
  const { quotes, loading } = useAppContext();

  const thisMonthQuotes = quotes.filter((q) => {
    const d = new Date(q.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const pending  = quotes.filter((q) => q.status === "Draft" || q.status === "Sent").length;
  const closed   = quotes.filter((q) => q.status === "Accepted" || q.status === "Rejected").length;
  const accepted = quotes.filter((q) => q.status === "Accepted").length;
  const totalValue = quotes
    .filter((q) => q.status === "Accepted")
    .reduce((sum, q) => sum + q.total, 0);

  const recentQuotes = quotes.slice(0, 5);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Overview for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Quotes This Month"
          value={thisMonthQuotes.length}
          sub={`${quotes.length} total all time`}
          accent="var(--accent)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={pending}
          sub="Draft + Sent"
          accent="#f59e0b"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label="Closed"
          value={closed}
          sub={`${accepted} accepted`}
          accent="#34d399"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <StatCard
          label="Accepted Revenue"
          value={`$${totalValue.toLocaleString()}`}
          sub="All time"
          accent="#a78bfa"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* Recent quotes */}
      <div
        className="rounded-xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
            Recent Quotes
          </h2>
          <a href="/quotes" className="text-sm" style={{ color: "var(--accent)" }}>
            View all →
          </a>
        </div>
        {recentQuotes.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No quotes yet.{" "}
            <a href="/quotes/create" style={{ color: "var(--accent)" }}>Create one →</a>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Quote No.", "Customer", "Total", "Status", "Date"].map((h) => (
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
              {recentQuotes.map((q, i) => (
                <tr
                  key={q.id}
                  style={{ borderBottom: i < recentQuotes.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: "var(--accent)" }}>
                    {q.quoteNumber}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-primary)" }}>
                    {q.customerName}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    ${q.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: statusColors[q.status].bg, color: statusColors[q.status].text }}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {q.createdAt}
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

function StatCard({
  label, value, sub, accent, icon,
}: {
  label: string; value: string | number; sub: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="text-2xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {sub}
      </div>
    </div>
  );
}
