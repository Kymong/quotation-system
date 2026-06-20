import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "QuoteDesk",
  description: "Vehicle & Machinery Quotation Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Providers>
          <Sidebar />
          <main className="flex-1 min-h-screen" style={{ marginLeft: "240px", backgroundColor: "var(--bg-base)" }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
