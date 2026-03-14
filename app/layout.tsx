import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PathologyLab Pro",
  description: "LIS built with Next.js + Supabase + Vercel",
  icons: {
    icon: "/laboratory-microscope-icon.svg",
    shortcut: "/laboratory-microscope-icon.svg",
    apple: "/laboratory-microscope-icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


