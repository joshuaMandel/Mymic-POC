import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Aurora from "@/components/Aurora";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyMik — Find where your life fits in a new city",
  description:
    "MyMik translates the neighborhoods you know into the city you're moving to.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans text-brand-text antialiased">
        <Aurora />
        {children}
      </body>
    </html>
  );
}
