import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { inter } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "D4Gen Landing",
  description: "Landing application for the D4Gen monorepo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="d4gen-landing-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
