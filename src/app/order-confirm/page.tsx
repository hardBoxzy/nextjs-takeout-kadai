'use client'; // クライアント（ブラウザ）側で動作

import { useState ,useEffect} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '@/hooks/useCart';
import CartItemCard from '@/components/CartItemCard';

// 注文確認ページ
export default function OrderConfirmPage() {
    // 1. クライアント側でマウントされたかどうかの管理フラグ
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { cartItems, totalPrice } = useCart(); // カート情報と制御関数を取得
  const finalPrice = totalPrice ; // 最終的な合計金額
  const [userName, setUserName] = useState(''); // お名前
  const [phoneNumber, setPhoneNumber] = useState(''); // 電話番号
  const [notes, setNotes] = useState(''); // 備考
  const [isAgreed, setIsAgreed] = useState(false); // 同意のチェック有無
  const [errorMessage, setErrorMessage] = useState(''); // エラーメッセージ
  useEffect(() => { setIsMounted(true); }, []);
  const isButtonDisabled = !isAgreed || !userName.trim() || !phoneNumber.trim();

  // 初期値として今日の日付、12時、00分を設定
   // 日本時間の「YYYY-MM-DD」を正しく取得する関数
  const getJstDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [pickupDate, setPickupDate] = useState(getJstDateString(new Date()));
  const [pickupHour, setPickupHour] = useState('12');
  const [pickupMinute, setPickupMinute] = useState('00');
   // 日付の選択肢：今日から7日分を生成
  const dateOptions = Array.from({ length: 2 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const label = `${yyyy}年${mm}月${dd}日`;
    return <option key={dateStr} value={dateStr}>{label}</option>;
  });
  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const hour = String(i + 11).padStart(2, '0');
    return <option key={hour} value={hour}>{hour}</option>;
  });
  // 分の選択肢（10分刻み：00, 10, 20, 30, 40, 50 の6つを正しく生成）
  const minuteOptions = Array.from({ length: 6 }, (_, i) => {
    const minute = String(i * 10).padStart(2, '0');
    return <option key={minute} value={minute}>{minute}</option>;
  });
  // 選択された日時が過去かどうかを判定する
  const checkIsPastDateTime = (date: string, hour: string, minute: string) => {
    const now = new Date();
    // 選択された「YYYY-MM-DD」と「HH:mm」を結合してDateオブジェクトを作成,末尾に「+09:00」を足して、日本時間として正しく認識させます
    const selectedDateTime = new Date(`${date}T${hour}:${minute}:00+09:00`);
    if (selectedDateTime < now) { 
      setErrorMessage(`${selectedDateTime}現在より過去の日時は選択できません。`);
      return true;
    } else {
      setErrorMessage('');
      return false;
    }
  };

  // 決済ボタン押下時のイベントハンドラ
  const handleConfirmPayment = async () => {
    if (!isAgreed) {
      setErrorMessage('利用規約とプライバシーポリシーに同意してください。');
      return;
    }
    // 送信直前にもう一度最新の現在時刻とチェック
    const isPast = checkIsPastDateTime(pickupDate, pickupHour, pickupMinute);
    if (isPast) {
      return; // 過去なら処理を中断
    }
    const pickupAt = `${pickupDate} ${pickupHour}:${pickupMinute}`;
    // backendにカート情報とお届け先を送信し
    const checkoutRes = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cartItems, userName, phoneNumber, notes, pickupAt }),
    });
    if (!checkoutRes.ok) {
      setErrorMessage('決済ページの生成に失敗しました。');
      return;
    }
    const checkoutData = await checkoutRes.json();
    if (checkoutData.url) {
      router.push(checkoutData.url); // 決済ページへ遷移
    }
  };

  // キャンセル時のイベントハンドラ
  const handleCancel = () => {
    // 確認画面を表示
    if (confirm('入力内容が破棄されます。よろしいですか？')) {
      router.push('/cart'); // カートページへ遷移
    }
  };

  // 2. マウントされる前（サーバー側でのSSR時）は、ハイドレーションエラーを防ぐために
  // プレースホルダー（ローディング画面など）か、空の共通UIを返す
  if (!isMounted) {
    return (
      <main className="container mx-auto p-4">
        <div className="text-center py-16">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </main>
    );
  }
  return (
    <main className="container mx-auto px-4 py-8">
      {errorMessage && (
        <p className="text-red-600 text-center mb-4">{errorMessage}</p>
      )}
      <h1 className="text-center mb-1">ご注文内容の入力</h1>
      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600">カートに商品がありません。</p>
          <Link href="/products" className="text-indigo-600 hover:underline">← 商品一覧に戻る</Link>
        </div>
      ) : (
        <div    >
          <div  className="max-w-xl mx-auto py-10">
            <div className="mt-3 border-t border-gray-300 pt-6">
              <label className="block font-bold mb-1" htmlFor="address">
                お名前<span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-md">必須</span>
              </label>
              <input
                id="userName" value={userName} placeholder="お名前を入力してください" required
                className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setUserName(e.target.value)}
              />
              <label className="block font-bold mb-1" htmlFor="phoneNumber">
                電話番号<span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-md">必須</span>
              </label>
              <input
                id="phoneNumber" value={phoneNumber} placeholder="電話番号を入力してください" required
                className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <label className="block font-bold mb-1" htmlFor="notes">
                備考
              </label>
              <textarea
                id="notes" value={notes} placeholder="備考を入力してください"
                className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setNotes(e.target.value)}
              />
              <label className="block font-bold mb-1" htmlFor="pickupAt">
                受取日時
              </label>
              {/* 日付の選択 */}
              <select
                id="pickupDate"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {dateOptions}
              </select>
              <select
                id="pickupHour"
                value={pickupHour}
                onChange={(e) => setPickupHour(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {hourOptions}
                </select>
                <span>時</span>
                            <select
                id="pickupMinute"
                value={pickupMinute}
                onChange={(e) => setPickupMinute(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {minuteOptions}
              </select>
              <span>分</span>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center pt-4 text-green-600 text-2xl font-bold">
                <span>支払い合計：</span><span>¥{finalPrice.toLocaleString()}</span>
              </div>
              <p className="text-gray-500 text-sm mt-2 text-right">
                ※価格はすべて税込表記です。また、お支払いはお店でお願いします。
              </p>
            </div>

            <div className="mt-8">
              <p className="text-sm">
                ご注文の確定前に、必ず
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline">
                  利用規約
                </Link>
                および
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline">
                  プライバシーポリシー
                </Link>
                をお読みください。<br/>同意のチェックをもって、上記規約に同意したものとみなされます。
              </p>
              <div className="mt-6 flex items-center">
                <input
                  type="checkbox" id="agreement-checkbox" checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="agreement-checkbox" className="ml-2 text-base font-semibold text-gray-800 leading-snug">
                  利用規約およびプライバシーポリシーに同意する
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={handleConfirmPayment}
                disabled={isButtonDisabled}
                className={`py-2 px-6 rounded-sm text-white ${
                  isButtonDisabled
                    ?  'bg-gray-400 cursor-not-allowed'
                    :'bg-indigo-500 hover:bg-indigo-600'
                }`}
              >
                予約する
              </button>
              <button
                type="button" onClick={handleCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-6 rounded-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
          <div className="flex flex-col space-y-6">
            {cartItems.map((item: CartItem) => (
              <CartItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}