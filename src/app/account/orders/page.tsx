'use client'; // クライアント（ブラウザ）側で動作

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OrderData, orderStatus, OrderStatus, paymentStatus, PaymentStatus } from '@/types/order';

// 注文履歴一覧ページ
export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
//ビルド時のプリレンダリング検証をスキップさせます
  // 初期表示時に注文データを取得
  useEffect(() => {
    const getOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.message || '注文履歴の取得に失敗しました。');
          setLoading(false); // 読み込み終了
          return;
        }
        setOrders(data.orders); // 注文履歴データを更新
      } catch (err) {
        console.error(err);
        setErrorMessage('通信エラーが発生しました。');
      } finally {
        setLoading(false); // 読み込み終了
      }
    };
    // 注文履歴データを取得
    getOrders();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-600 text-lg">注文履歴データを読み込み中です...</div>;
  if (errorMessage) return <p className="text-center py-12 text-red-600">{errorMessage}</p>;
  if (orders.length === 0) return <p className="text-center py-12 text-gray-500">注文履歴はありません。</p>;

  // ステータスに応じて表示スタイルを決定
  const getStatusStyle = (status: OrderData['status'] | OrderData['paymentStatus']) => {
    switch (status) {
      case '未処理':
      case '処理中':
      case '未決済':
      case '決済処理中':
      case '返金処理中': // 進行中または要確認の状態
        return 'text-yellow-500';
      case '出荷済み':
      case '完了':
      case '決済成功': // ポジティブな完了状態
        return 'text-green-500';
      case 'キャンセル':
      case '決済失敗':
      case '返金済み': // ネガティブな最終状態
        return 'text-red-500';
      default:
        return 'text-gray-500'; // デフォルトの色
    }
  };

  // テーブルの共通スタイル
  const tableStyle = 'px-3 py-2 border-b';

  // ステータス選択オプションの生成
  const orderStatusOptions = orderStatus.map((status, index) => (
    <option key={index} value={status} >
      {status}
    </option>
  ));
  const onUpdateOrderStatus = async (orderId:number, newStatus:string ) => {
    try {  
      const checkoutRes = await fetch('/api/orders/checkout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus}),
      });
      if (!checkoutRes.ok) {
          throw new Error('ステータスの更新に失敗しました');
      }
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as OrderStatus } : order
        )
      );
      alert('ステータスを更新しました');
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。もう一度お試しください。');
    }
  };
  // 決済ステータス選択オプションの生成
  const paymentStatusOptions = paymentStatus.map((status, index) => (
    <option key={index} value={status} >
      {status}
    </option>
  ));
  const onUpdatePaymentStatus = async(orderId:number, newPaymentStatus: string) => {
    try {  
      const checkoutRes = await fetch('/api/orders/checkout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newPaymentStatus}),
      });
        if (!checkoutRes.ok) {
            throw new Error('ステータスの更新に失敗しました');
        }
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, paymentStatus: newPaymentStatus as PaymentStatus } : order
        )
      );
      alert('ステータスを更新しました');
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。もう一度お試しください。');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="my-4">
        <Link href="/account" className="text-indigo-600 hover:underline">
          ← マイページに戻る
        </Link>
      </div>
      <h1 className="text-center mb-8">注文履歴一覧</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg shadow-sm p-4">
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-lg font-semibold">注文ID：{order.id}</p>
                <p>お客様：{order.userName }</p>   
                <p>電話番号：{order.phoneNumber }</p>    
                <p>備考：{order.notes }</p>  
              </div>
              <div>
                <p className="text-lg font-semibold min-h-[28px]">  </p>
                <p>受取日時：{order.createdAt ? new Date(order.pickupAt).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</p>       
                <p>注文日時：{order.createdAt ? new Date(order.createdAt).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</p>
             </div>
              <div className="text-right font-semibold">
                <div>
                  <p className="text-blue-600 text-xl">合計金額：¥{order.totalPrice.toLocaleString()}</p>
                  <label htmlFor={`status-${order.id}`} className={getStatusStyle(order.status)}>
                    注文状況：</label>
                  <select id={`status-${order.id}`} value={order.status}
                    onChange={(e) =>  onUpdateOrderStatus(order.id, String(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-indigo-500 mb-4 "
                  >{orderStatusOptions}</select>
                </div>
                <div>
                  <label htmlFor={`paymentStatus-${order.id}`} className={getStatusStyle(order.paymentStatus)}>
                    決済状況：</label>
                  <select id={`paymentStatus-${order.id}`} value={order.paymentStatus}
                    onChange={(e) =>  onUpdatePaymentStatus(order.id, String(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-indigo-500 mb-4 "
                  >{paymentStatusOptions}</select>
                </div>
              </div>
            </div>

            <table className="w-full text-left border-t border-gray-200 shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className={tableStyle}>商品名</th>
                  <th className={tableStyle}>数量</th>
                  <th className={tableStyle}>単価（税込）</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className={tableStyle}>{item.productName}</td>
                    <td className={tableStyle}>{item.quantity}</td>
                    <td className={tableStyle}>¥{item.unitPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}