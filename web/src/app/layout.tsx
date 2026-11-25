import type { Metadata } from "next";
import { Inter, Lexend, Manrope, JetBrains_Mono } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const lexend = Lexend({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-lexend", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jbmono", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} · ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Croise les réclamations des émetteurs de monnaie électronique de l'UEMOA pour geler l'argent volé avant le retrait, et transforme chaque plainte légitime en dossier de litige PI-SPI dans les délais.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${lexend.variable} ${manrope.variable} ${mono.variable} ${inter.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
