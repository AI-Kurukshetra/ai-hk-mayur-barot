import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PathologyLab Pro",
  description: "LIS built with Next.js + Supabase + Vercel",
  icons: {
    icon: "/favicon-microscope-circle.svg",
    shortcut: "/favicon-microscope-circle.svg",
    apple: "/favicon-microscope-circle.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


