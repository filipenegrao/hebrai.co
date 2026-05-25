import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_Hebrew } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const notoSerifHebrew = Noto_Serif_Hebrew({ subsets: ["hebrew"], variable: "--font-hebrew" });

export const metadata: Metadata = {
  title: "hebrai.co — Hebraico Bíblico",
  description: "Aprenda vocabulário de hebraico bíblico com revisão espaçada adaptativa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoSerifHebrew.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
