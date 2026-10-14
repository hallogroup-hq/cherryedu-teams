import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cherry Edu Teams",
    template: "%s · Cherry Edu Teams",
  },
  description:
    "Platform manajemen pelatihan dan kompetensi barista untuk bisnis kopi Indonesia.",
  robots: {
    index: false, // Teams platform — not for public indexing
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
