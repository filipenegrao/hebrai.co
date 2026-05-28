import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "hebrai.co — Hebraico Bíblico",
  description: "Aprenda vocabulário de hebraico bíblico com revisão espaçada adaptativa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/coa1zta.css" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
