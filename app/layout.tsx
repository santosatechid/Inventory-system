import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type Metadata, type Viewport } from "next";
import localFont from "next/font/local";

import { ReactQueryProvider } from "@/app/providers";
import { type ReactNode } from "react";

const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#1d9c2f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NDT Inventory · PT Luindo Prima",
  description: "Sistem inventori consumable NDT PT Luindo Prima",
  icons: {
    icon: process.env.CLIENT_FAVICON || "/favicon.ico",
    apple: process.env.CLIENT_FAVICON || "/icon-192.webp",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Toaster />
        <ReactQueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
