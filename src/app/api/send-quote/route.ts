import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  // Verify the request comes from our own app, not an outside caller
  const token = request.headers.get("x-internal-token");
  if (!token || token !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quoteId } = await request.json();
  if (!quoteId) {
    return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
  }

  // Fetch quote with items
  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .select("*, quote_items(*)")
    .eq("id", quoteId)
    .single();
  if (qErr || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Fetch customer for email address
  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("email, contact, company")
    .eq("id", quote.customer_id)
    .single();
  if (cErr || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (!customer.email) {
    return NextResponse.json({ error: "Customer has no email address" }, { status: 422 });
  }

  const items: { description: string; quantity: number; unit_price: number }[] =
    quote.quote_items ?? [];

  // Send email via Resend
  const { error: mailErr } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: customer.email,
    subject: `Quotation ${quote.quote_number} from QuoteDesk`,
    html: buildEmailHtml({
      quoteNumber: quote.quote_number,
      customerName: quote.customer_name,
      contactName: customer.contact,
      customerEmail: customer.email,
      items,
      total: Number(quote.total),
      notes: quote.notes ?? "",
      date: (quote.created_at as string).slice(0, 10),
    }),
  });

  if (mailErr) {
    return NextResponse.json({ error: mailErr.message }, { status: 500 });
  }

  // Mark quote as Sent
  await supabase.from("quotes").update({ status: "Sent" }).eq("id", quoteId);

  return NextResponse.json({ success: true });
}

// ── Email HTML builder ────────────────────────────────────────────────────────

function buildEmailHtml(data: {
  quoteNumber: string;
  customerName: string;
  contactName: string;
  customerEmail: string;
  items: { description: string; quantity: number; unit_price: number }[];
  total: number;
  notes: string;
  date: string;
}) {
  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const itemRows = data.items
    .map((item) => {
      const subtotal = item.quantity * item.unit_price;
      return `
        <tr>
          <td style="padding:12px 16px 12px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">${item.description}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;text-align:center;">${item.quantity}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;text-align:right;">${fmt(item.unit_price)}</td>
          <td style="padding:12px 0 12px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#111827;text-align:right;">${fmt(subtotal)}</td>
        </tr>`;
    })
    .join("");

  const notesBlock = data.notes
    ? `<div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:6px;border-left:3px solid #d1d5db;">
         <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Notes</p>
         <p style="margin:0;font-size:14px;color:#374151;">${data.notes}</p>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Quotation ${data.quoteNumber}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#0f1117;padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4f7ef8;font-weight:600;">Quotation</p>
            <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${data.quoteNumber}</h1>
            <p style="margin:12px 0 0;font-size:13px;color:#8892b0;">Issued: ${data.date}</p>
          </td>
        </tr>

        <!-- To block -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Prepared for</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${data.customerName}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">${data.contactName} &bull; ${data.customerEmail}</p>
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="padding:28px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr style="border-bottom:2px solid #111827;">
                  <th style="padding:8px 16px 8px 0;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Description</th>
                  <th style="padding:8px 8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Qty</th>
                  <th style="padding:8px 8px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Unit Price</th>
                  <th style="padding:8px 0 8px 8px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- Total -->
        <tr>
          <td style="padding:20px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:2px solid #0f1117;padding-top:16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:14px;color:#6b7280;">Total Amount</td>
                      <td style="text-align:right;font-size:26px;font-weight:700;color:#111827;">${fmt(data.total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Notes -->
        ${data.notes ? `<tr><td style="padding:0 40px;">${notesBlock}</td></tr>` : ""}

        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px;margin-top:8px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              This quotation was sent via <strong>QuoteDesk</strong>. Please reply to this email to accept, decline, or ask questions.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
