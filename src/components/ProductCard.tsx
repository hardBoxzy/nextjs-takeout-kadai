'use client'; // クライアント（ブラウザ）側で動作

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
// 商品カードコンポーネントに渡すデータ（props）の型定義
export interface ProductCardProps {
  id: string; // 商品ID
  title: string; // 商品タイトル
  price: number; // 商品価格

  imageUrl?: string; // 商品画像URL
  imageSize?: 300 | 400; // 画像サイズ

  rating?: number; // レビュー評価（平均）
  reviewCount?: number; // 総レビュー数

  showCartButton?: boolean; // 「カートへ」の有無
  className?: string; // 外部からのスタイル調整用
}

// 商品カードの共通コンポーネント
export default function ProductCard({
  id,
  title,
  price,
  imageUrl,
  imageSize = 300,
  rating,
  reviewCount,
  showCartButton = false,
  className = ''
}: ProductCardProps) {
    // カート管理用の関数を取得
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(id); // カートに追加済みか
  // 💡 コンポーネントがブラウザにマウントされたかを管理するステートを追加
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // カートボタン押下時のイベントハンドラ
  const handleCart = () => {
    // カートに追加
    addItem({ id, title, price, imageUrl });
  };

  // 画像の指定がなければダミー画像を表示
  const finalImageUrl = imageUrl
    ? `/uploads/${imageUrl}`
    : '/images/no-image.jpg';

  return (
    <div className={`
      flex flex-col bg-white max-w-sm w-full p-2
      ${className}
    `}>
      <Link href={`/products/${id}`}>
        <Image
          src={finalImageUrl} alt={title || '商品画像'} width={imageSize} height={imageSize} loading="eager"
          className="w-full object-contain aspect-square"    
                
        />
      </Link>
      <div className="flex flex-col">
      <h3 className="text-sm font-semibold leading-tight mb-1">{title}</h3>
      {rating !== undefined && reviewCount !== undefined && (
        <p>☆☆☆☆☆（-件）</p>
      )}
        <div className="flex justify-between items-center w-full mt-2">     
          <p className="text-lg font-bold">¥{price.toLocaleString()}</p>
          {showCartButton && (
            <button
          // 💡 マウントされるまでは、強制的にサーバー側と同じ設定（未追加状態）にする
          onClick={isMounted && !inCart ? handleCart : undefined}
              disabled={inCart}
          className={
            isMounted && inCart
              ? "border py-2 px-4 rounded-sm bg-indigo-500 text-white" // 追加済みスタイル
              : "border py-2 px-4 rounded-sm border-indigo-500 text-indigo-500" // カートへスタイル
          }
            >
          {isMounted && inCart ? "追加済み" : "カートへ"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}