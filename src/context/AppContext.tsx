"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Customer, Quote, QuoteItem, QuoteStatus } from "@/lib/mockData";

type AppContextType = {
  customers: Customer[];
  quotes: Quote[];
  loading: boolean;
  addCustomer: (data: Omit<Customer, "id">) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addQuote: (data: {
    customerId: string;
    customerName: string;
    items: QuoteItem[];
    total: number;
    status: QuoteStatus;
    notes?: string;
  }) => Promise<string>;
  updateQuoteStatus: (id: string, status: QuoteStatus) => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

// ── DB row → app type mappers ─────────────────────────────────────────────────

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    company: row.company as string,
    contact: row.contact as string,
    email: (row.email as string) ?? "",
    phone: (row.phone as string) ?? "",
  };
}

function mapQuoteItem(row: Record<string, unknown>): QuoteItem {
  return {
    id: row.id as string,
    description: row.description as string,
    quantity: row.quantity as number,
    unitPrice: Number(row.unit_price),
  };
}

function mapQuote(row: Record<string, unknown>): Quote {
  const items = Array.isArray(row.quote_items)
    ? (row.quote_items as Record<string, unknown>[]).map(mapQuoteItem)
    : [];
  return {
    id: row.id as string,
    quoteNumber: row.quote_number as string,
    customerId: row.customer_id as string,
    customerName: row.customer_name as string,
    items,
    total: Number(row.total),
    status: row.status as QuoteStatus,
    notes: (row.notes as string) ?? undefined,
    createdAt: (row.created_at as string).slice(0, 10),
    updatedAt: (row.updated_at as string).slice(0, 10),
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: cRows }, { data: qRows }] = await Promise.all([
        supabase.from("customers").select("*").order("created_at", { ascending: true }),
        supabase
          .from("quotes")
          .select("*, quote_items(*)")
          .order("created_at", { ascending: false }),
      ]);
      setCustomers((cRows ?? []).map(mapCustomer));
      setQuotes((qRows ?? []).map(mapQuote));
      setLoading(false);
    }
    load();
  }, []);

  // ── Customer mutations ────────────────────────────────────────────────────

  async function addCustomer(data: Omit<Customer, "id">) {
    const { data: row, error } = await supabase
      .from("customers")
      .insert({ company: data.company, contact: data.contact, email: data.email, phone: data.phone })
      .select()
      .single();
    if (error) throw error;
    setCustomers((prev) => [...prev, mapCustomer(row)]);
  }

  async function updateCustomer(customer: Customer) {
    const { error } = await supabase
      .from("customers")
      .update({ company: customer.company, contact: customer.contact, email: customer.email, phone: customer.phone })
      .eq("id", customer.id);
    if (error) throw error;
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
  }

  async function deleteCustomer(id: string) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  // ── Quote mutations ───────────────────────────────────────────────────────

  async function addQuote(data: {
    customerId: string;
    customerName: string;
    items: QuoteItem[];
    total: number;
    status: QuoteStatus;
    notes?: string;
  }): Promise<string> {
    const { data: numData, error: numErr } = await supabase.rpc("get_next_quote_number");
    if (numErr) throw numErr;
    const quoteNumber = numData as string;

    const { data: quoteRow, error: qErr } = await supabase
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        customer_id: data.customerId,
        customer_name: data.customerName,
        status: data.status,
        total: data.total,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (qErr) throw qErr;

    if (data.items.length > 0) {
      const { error: iErr } = await supabase.from("quote_items").insert(
        data.items.map((item) => ({
          quote_id: quoteRow.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        }))
      );
      if (iErr) throw iErr;
    }

    const newQuote: Quote = {
      id: quoteRow.id,
      quoteNumber,
      customerId: data.customerId,
      customerName: data.customerName,
      items: data.items,
      total: data.total,
      status: data.status,
      notes: data.notes,
      createdAt: (quoteRow.created_at as string).slice(0, 10),
      updatedAt: (quoteRow.updated_at as string).slice(0, 10),
    };
    setQuotes((prev) => [newQuote, ...prev]);
    return quoteNumber;
  }

  async function updateQuoteStatus(id: string, status: QuoteStatus) {
    const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
    if (error) throw error;
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
  }

  return (
    <AppContext.Provider
      value={{
        customers,
        quotes,
        loading,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addQuote,
        updateQuoteStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
