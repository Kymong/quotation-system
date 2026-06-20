"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import type { Customer } from "@/lib/mockData";

type CustomerForm = { company: string; contact: string; email: string; phone: string };
type FormErrors = Partial<CustomerForm>;
type ModalState = { mode: "closed" } | { mode: "add" } | { mode: "edit"; customer: Customer };

const inputStyle = {
  backgroundColor: "var(--bg-hover)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  outline: "none",
};

const inputErrorStyle = { ...inputStyle, border: "1px solid #ef4444" };

export default function CustomersPage() {
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useAppContext();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, search]);

  async function handleSave(data: CustomerForm) {
    if (modal.mode === "add") {
      await addCustomer(data);
    } else if (modal.mode === "edit") {
      await updateCustomer({ ...modal.customer, ...data });
    }
    setModal({ mode: "closed" });
  }

  const customerToDelete = confirmDeleteId
    ? customers.find((c) => c.id === confirmDeleteId)
    : null;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Customers
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {customers.length} registered {customers.length === 1 ? "company" : "companies"}
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "var(--accent)", color: "white" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5" style={{ maxWidth: "380px" }}>
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2"
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ color: "var(--text-muted)" }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by company, contact, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm"
          style={inputStyle}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {search
                ? `No customers matching "${search}"`
                : "No customers yet. Add your first one."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Company Name", "Contact Person", "Email", "Phone", ""].map((h) => (
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
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                        style={{ width: "32px", height: "32px", backgroundColor: "#1e2a4a", color: "var(--accent)" }}
                      >
                        {c.company.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {c.company}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {c.contact}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {c.email}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {c.phone}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <a
                        href="/quotes/create"
                        className="text-xs px-3 py-1.5 rounded-md"
                        style={{ color: "var(--accent)", backgroundColor: "#1a2a4a" }}
                      >
                        New Quote
                      </a>
                      <button
                        onClick={() => setModal({ mode: "edit", customer: c })}
                        className="text-xs px-3 py-1.5 rounded-md"
                        style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-hover)" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(c.id)}
                        className="text-xs px-3 py-1.5 rounded-md"
                        style={{ color: "#f87171", backgroundColor: "#2a1018" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.mode !== "closed" && (
        <CustomerModal
          initial={modal.mode === "edit" ? modal.customer : undefined}
          onSave={handleSave}
          onClose={() => setModal({ mode: "closed" })}
        />
      )}

      {confirmDeleteId && customerToDelete && (
        <ConfirmDeleteModal
          company={customerToDelete.company}
          onConfirm={async () => {
            await deleteCustomer(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

function CustomerModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Customer;
  onSave: (data: CustomerForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CustomerForm>({
    company: initial?.company ?? "",
    contact: initial?.contact ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof CustomerForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!form.company.trim()) errs.company = "Required";
    if (!form.contact.trim()) errs.contact = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await onSave(form);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-xl p-6 mx-4"
        style={{ maxWidth: "440px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
          {initial ? "Edit Customer" : "Add Customer"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Company Name *" error={errors.company}>
            <input
              type="text" placeholder="e.g. Pacific Builders Co."
              value={form.company} onChange={(e) => set("company", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={errors.company ? inputErrorStyle : inputStyle}
              autoFocus
            />
          </Field>

          <Field label="Contact Person *" error={errors.contact}>
            <input
              type="text" placeholder="e.g. James Tan"
              value={form.contact} onChange={(e) => set("contact", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={errors.contact ? inputErrorStyle : inputStyle}
            />
          </Field>

          <Field label="Email">
            <input
              type="email" placeholder="e.g. james@company.com"
              value={form.email} onChange={(e) => set("email", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={inputStyle}
            />
          </Field>

          <Field label="Phone">
            <input
              type="text" placeholder="e.g. +65 9123 4567"
              value={form.phone} onChange={(e) => set("phone", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={inputStyle}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "var(--accent)", color: "white", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Saving…" : initial ? "Save Changes" : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────

function ConfirmDeleteModal({
  company,
  onConfirm,
  onCancel,
}: {
  company: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try { await onConfirm(); } finally { setDeleting(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={onCancel}
    >
      <div
        className="w-full rounded-xl p-6 mx-4"
        style={{ maxWidth: "400px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full mb-4"
          style={{ backgroundColor: "#2a1018" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Delete Customer
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Remove{" "}
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{company}</span>{" "}
          permanently? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm} disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "#ef4444", color: "white", opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}
