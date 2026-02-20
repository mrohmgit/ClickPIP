import type { Metadata } from "next";
import { Mitr, Sarabun } from "next/font/google";
import "./globals.css";

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
  title: "ClickPIP — ระบบจัดการแผนพัฒนาประสิทธิภาพ",
  description: "ระบบจัดการแผนพัฒนาประสิทธิภาพการทำงาน (PIP) สำหรับติดตามและพัฒนาพนักงาน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${mitr.variable} ${sarabun.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
