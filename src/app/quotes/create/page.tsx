"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

const inputStyle = {
  backgroundColor: "var(--bg-hover)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  outline: "none",
};

export default function CreateQuotePage() {
  const { customers, addQuote } = useAppContext();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [savedQuote, setSavedQuote] = useState<{ quoteNumber: string; company: string; status: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: generateId(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(id: string) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  async function handleSubmit(status: "Draft" | "Sent") {
    if (!selectedCustomerId || !selectedCustomer) {
      alert("Please select a customer.");
      return;
    }
    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      alert("Please add at least one item with a description.");
      return;
    }
    setSaving(true);
    try {
      const quoteItems = validItems.map(({ id, ...rest }) => ({ ...rest, id }));
      const quoteNumber = await addQuote({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.company,
        items: quoteItems,
        total,
        status,
        notes,
      });
      setSavedQuote({ quoteNumber, company: selectedCustomer.company, status });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSelectedCustomerId("");
    setItems([{ id: generateId(), description: "", quantity: 1, unitPrice: 0 }]);
    setNotes("");
    setSavedQuote(null);
  }

  if (savedQuote) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: "#0f2a1e" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Quote Created
        </h2>
        <p className="text-sm font-mono mb-1" style={{ color: "var(--accent)" }}>
          {savedQuote.quoteNumber}
        </p>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Saved as <strong>{savedQuote.status}</strong> for {savedQuote.company}
        </p>
        <div className="flex gap-3">
          <a
            href="/quotes"
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            View Records
          </a>
          <button
            onClick={resetForm}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            New Quote
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Create Quote
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Fill in the details below to generate a new quotation
        </p>
      </div>

      <div className="space-y-6">
        {/* Customer */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Customer
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Select Company *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm appearance-none"
                style={{
                  ...inputStyle,
                  color: selectedCustomerId ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                <option value="">Choose a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company}
                  </option>
                ))}
              </select>
            </div>
            {selectedCustomer && (
              <div
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Contact</p>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {selectedCustomer.contact}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  {selectedCustomer.email} · {selectedCustomer.phone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div
          className="rounded-xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Line Items
            </h2>
          </div>

          <div className="p-6 space-y-3">
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 90px 120px 100px 36px" }}>
              {["Description", "Qty", "Unit Price ($)", "Subtotal", ""].map((h) => (
                <div key={h} className="text-xs font-medium uppercase tracking-wider px-1" style={{ color: "var(--text-muted)" }}>
                  {h}
                </div>
              ))}
            </div>

            {items.map((item) => {
              const subtotal = item.quantity * item.unitPrice;
              return (
                <div key={item.id} className="grid gap-3 items-center" style={{ gridTemplateColumns: "1fr 90px 120px 100px 36px" }}>
                  <input
                    type="text"
                    placeholder="e.g. 30-Ton Excavator (Monthly Rental)"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-center"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice || ""}
                    placeholder="0.00"
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm"
                    style={inputStyle}
                  />
                  <div
                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-right"
                    style={{
                      backgroundColor: "var(--bg-base)",
                      border: "1px solid var(--border)",
                      color: subtotal > 0 ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="flex items-center justify-center w-9 h-9 rounded-lg"
                    style={{
                      backgroundColor: "var(--bg-hover)",
                      color: items.length === 1 ? "var(--text-muted)" : "#f87171",
                      border: "1px solid var(--border)",
                      cursor: items.length === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              );
            })}

            <button
              onClick={addItem}
              className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg text-sm"
              style={{ color: "var(--accent)", backgroundColor: "var(--bg-hover)", border: "1px dashed var(--border)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Item
            </button>
          </div>

          {/* Total */}
          <div className="px-6 py-4 flex justify-end" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-8">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Total Amount
              </span>
              <span className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                ${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Notes (Optional)
          </h2>
          <textarea
            rows={3}
            placeholder="Validity period, payment terms, special conditions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
            style={inputStyle}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <a
            href="/quotes"
            className="px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            Cancel
          </a>
          <button
            onClick={() => handleSubmit("Draft")}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save as Draft"}
          </button>
          <button
            onClick={() => handleSubmit("Sent")}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--accent)", color: "white", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save & Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
