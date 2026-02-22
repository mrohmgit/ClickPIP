import type { Metadata } from "next";
import { Mitr, Sarabun } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["thai", "latin"],
  weight: ["500", "700"],
  display: "swap",
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClickPIP — ระบบจัดการประสิทธิภาพการทำงาน",
  description: "ระบบจัดการประสิทธิภาพการทำงานครบวงจร ครอบคลุม PIP, เวลาทำงาน, งานที่มอบหมาย, การประเมินผล, และ AI-HR Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${mitr.variable} ${sarabun.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
