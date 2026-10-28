'use client'; // クライアント（ブラウザ）側で動作
import Link from 'next/link';
import Image from "next/image";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { type ProductData } from '@/types/product';
import { useCart } from '@/hooks/useCart';
// 商品データの型定義
type Product = Pick<ProductData, 'id' | 'name' | 'price' | 'image_url' | 'review_avg' | 'review_count'>;


export default function Home() {
    // 商品データを保持するための状態
  const [pickUp, setPickUp] = useState<Product[]>([]);
  const [newArrival, setNewArrival] = useState<Product[]>([]);
  const [hotItems, setHotItems] = useState<Product[]>([]);

  // コンポーネントの表示直後に一度だけ実行される処理
  useEffect(() => {
    // 商品APIからデータを取得
    fetch('/api/products/home')
      .then(res => res.json()) // JSON形式に変換
      .then(data => { // 状態を更新
        setPickUp(data.pickUp);
        setNewArrival(data.newArrival);
        setHotItems(data.hotItems);
      })
      .catch(err => console.error('商品データの取得に失敗しました。', err)); // エラー時の処理
  }, []);

  const searchParams = useSearchParams();
  const message =
    searchParams.get('registered') ? '会員登録が完了しました。' :
    searchParams.get('logged-in') ? 'ログインしました。' :
    searchParams.get('logged-out') ? 'ログアウトしました。' :
    null;
  const sessionId = searchParams.get('session_id');
    const { clearCart } = useCart(); // カートクリア関数

  // 決済成功時にカートを空にする
  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [sessionId, clearCart]);
  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {sessionId && (
        <div className="w-full bg-green-100 text-green-800 p-3 text-center shadow-md flex flex-col items-center justify-center mb-6 rounded-md">
          <p className="text-xl font-bold mt-4">ご注文ありがとうございます！</p>
          <p>ご来店をお待ちしております。</p>
        </div>
      )}
      {message && (
        <div className="bg-green-100 text-green-800 p-3 text-center shadow-md">
          {message}
        </div>
      )}
      <section className="relative w-full h-[60vh] sm:h-[50vh] overflow-hidden">
        <Image
          src="/images/main-visual.jpg"
          alt="最新コレクションを発見"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 drop-shadow-md text-shadow-lg/50">
            美味しい料理を予約しよう
          </h1>
    <p className="text-base sm:text-lg md:text-xl mb-8 drop-shadow-md text-shadow-lg/50">
      待たずに美味しい料理を楽しめる
          </p>
          <Link href="/products">
      <button className="px-6 py-3 bg-white text-blue-800 font-semibold rounded-full shadow-md hover:bg-gray-200 transition-colors text-sm sm:text-base border border-gray-700">
        今すぐ見る
            </button>
          </Link>
        </div>
      </section>      
      <main className="container mx-auto px-8 pt-8 pb-12 flex flex-col gap-4 max-w-screen-xl">
         <section>
          <h2>
            <span>Pick Up</span>
          <span className="mx-2 font-light text-gray-400">|</span>
          <span className="text-base">おすすめ</span>
          </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {pickUp.slice(0, 3).map(item => (
                <ProductCard
                  key={`pickup-${item.id}`}
                  id={item.id.toString()}
                  title={item.name}
                  price={item.price}
                  imageUrl={item.image_url ?? undefined}
                  imageSize={400}
                />
              ))}
          </div>
        </section>

        <section>
          <h2>
            <span>New Menu</span>
          <span className="mx-2 font-light text-gray-400">|</span>
          <span className="text-base">新メニュー</span>
          </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {newArrival
              .slice(0, 4)
              .map(item => (
                <ProductCard
                  key={`new-${item.id}`}
                  id={item.id.toString()}
                  title={item.name}
                  price={item.price}
                  imageUrl={item.image_url ?? undefined}
                  showCartButton
                />
              ))}
          </div>
        </section>

        <section>
          <h2>
            <span>Hot Menu</span>
          <span className="mx-2 font-light text-gray-400">|</span>
          <span className="text-base">注目メニュー</span>
          </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {hotItems
              .slice(0, 4)
              .map(item => (
                <ProductCard
                  key={`featured-${item.id}`}
                  id={item.id.toString()}
                  title={item.name}
                  price={item.price}
                  imageUrl={item.image_url ?? undefined}
                  showCartButton
                />
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
