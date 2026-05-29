import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digitální Regál",
  description: "Organizujte svůj sklad a garáž",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
