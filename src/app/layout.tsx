import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header"; // Headerコンポーネント
import Footer from "@/components/Footer"; // Footerコンポーネント
import { getAuthUser } from "@/lib/auth";
import { CartProvider } from '@/hooks/useCart';
import { Suspense } from 'react';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAMURAI Kitchen Order",
  description: "最新のトレンドとテクノロジーを取り入れた料理をお届けします。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getAuthUser();    // 認証済みユーザー情報を取得
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
        <Suspense fallback={<div className="h-16 bg-gray-100" />}>
          <Header user={user} />
 
          {children}
          <Footer />
        </Suspense> 
        </CartProvider>
      </body>
    </html>
  );
}
