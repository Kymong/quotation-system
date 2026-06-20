"use server";

export async function sendQuoteEmail(quoteId: string): Promise<{ error?: string }> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return { error: "Server misconfiguration: INTERNAL_API_SECRET not set" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

  const res = await fetch(`${baseUrl}/api/send-quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": secret,
    },
    body: JSON.stringify({ quoteId }),
  });

  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "Failed to send" };
  return {};
}
