import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const sans = Hanken_Grotesk({ variable: "--font-sans", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const serif = Newsreader({ variable: "--font-serif", subsets: ["latin"], weight: ["400", "500"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Atria · Shared deal spaces for media",
  description:
    "Atria gives media sellers and the brands they work with one shared space per deal. Documents, conversations and decisions live together, always on the current version.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
