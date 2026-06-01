import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import Nav from "@/components/Nav";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "청약 대시보드",
  description: "한국부동산원 청약홈 공공 API 기반 청약 정보 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        <NuqsAdapter>
          <QueryProvider>
            <Nav />
            <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
