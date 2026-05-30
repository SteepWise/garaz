import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digitální Regál",
  description: "Organizujte svůj sklad a garáž",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
          }
        `}} />
      </body>
    </html>
  );
}
