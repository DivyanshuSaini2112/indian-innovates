import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FloodSense India — Real-Time Flood Intelligence",
  description: "Premium real-time flood risk intelligence platform for every district in India powered by IMD, CWC, and AI.",
  keywords: ["flood", "India", "flood prediction", "IMD", "flood alert", "disaster management"],
  openGraph: {
    title: "FloodSense India",
    description: "Real-time flood risk monitoring for all 700+ districts",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1A2A3F" />
      </head>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
