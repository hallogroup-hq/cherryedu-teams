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
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Cherry Edu Teams",
    template: "%s · Cherry Edu Teams",
  },
  description:
    "Platform manajemen pelatihan dan kompetensi barista untuk bisnis kopi Indonesia.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#140E0C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${fontSans.variable} ${fontSerif.variable} h-full`}>
      <body className="h-full font-sans antialiased bg-roast-950 text-roast-100">
        {children}
      </body>
    </html>
  );
}
