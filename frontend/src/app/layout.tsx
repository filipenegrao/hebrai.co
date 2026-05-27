import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  David_Libre,
  IBM_Plex_Mono,
  Noto_Serif_Hebrew,
} from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
});
const davidLibre = David_Libre({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700"],
  variable: "--font-david-libre",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});
const notoSerifHebrew = Noto_Serif_Hebrew({ subsets: ["hebrew"], variable: "--font-hebrew" });

export const metadata: Metadata = {
  title: "hebrai.co — Hebraico Bíblico",
  description: "Aprenda vocabulário de hebraico bíblico com revisão espaçada adaptativa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${cormorant.variable} ${davidLibre.variable} ${plexMono.variable} ${notoSerifHebrew.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
