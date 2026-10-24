"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from "react";
// 共通フッター
export default function Footer() {
  // 初期状態は空文字またはデフォルトの年（2026）にしておく
  const [currentYear, setCurrentYear] = useState<number | string>("");

  useEffect(() => {
    // ブラウザに読み込まれた後に動的に年を取得
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
   <footer className="bg-gray-800 py-4 text-white">
    <div className="container mx-auto px-4 max-w-6xl grid grid-cols-1 md:grid-cols-[2.5fr_1.5fr_1fr] gap-8 border-b border-gray-700 pb-8 mb-8">
      <div>
          <h3 className="text-xl mb-4">SAMURAI Kitchen Orderについて</h3>
          <p className="text-sm leading-relaxed">最新のトレンドとテクノロジーを取り入れた料理をお届けします。</p>
       </div>

      <div>
          <h3 className="text-xl mb-4">クイックリンク</h3>
          <ul className="space-y-2 list-none pl-0">
          <li><Link href="/privacy">プライバシーポリシー</Link></li>
          <li><Link href="/terms">利用規約</Link></li>
        </ul>
      </div>

      </div>
      <div className="container mx-auto px-4 pb-8 text-center text-sm">
        <p>&copy; {currentYear || "2026"} SAMURAI Kitchen Order. All Rights Reserved.</p>
      </div>
    </footer>
  );
}