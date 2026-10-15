import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Cherry Edu Teams — Specialty Coffee Academy",
    template: "%s · Cherry Edu Teams",
  },
  description:
    "Platform manajemen pelatihan dan kompetensi barista terstandarisasi untuk bisnis kopi Indonesia.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${fontSans.variable} ${fontSerif.variable} h-full`}>
      <body className="min-h-full font-sans antialiased bg-paper-100 text-roast-950">
        {children}
        <Toaster position="top-center" richColors theme="light" />
      </body>
    </html>
  );
}
