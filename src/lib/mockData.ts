// Type definitions only — all data is stored in Supabase.

export type Customer = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
};

export type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export type Quote = {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  items: QuoteItem[];
  total: number;
  status: QuoteStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
