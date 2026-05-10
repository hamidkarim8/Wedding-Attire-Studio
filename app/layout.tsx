import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Wedding Attire Studio",
  description: "AI-powered virtual wedding attire fitting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen bg-[#fafafa] text-neutral-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
