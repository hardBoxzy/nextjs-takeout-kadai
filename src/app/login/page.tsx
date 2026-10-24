'use client'; // クライアント（ブラウザ）側で動作

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; // 会員登録ページへのリンク用

// ログインページ
export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(''); // エラーメッセージ
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  // フォーム送信時のイベントハンドラ
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // デフォルトの送信動作をキャンセル
    setErrorMessage(''); // 送信前にエラーをクリア

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // 入力データのバリデーション
    if (!email?.trim() || !password?.trim()) {
      setErrorMessage('メールアドレスとパスワードを入力してください。');
      return;
    }

    try { // ログインAPIにPOSTリクエストを送信
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isAdmin) { // 管理者のログイン時
          router.push('/admin/products');
        } else if (redirect) { // 保護ページからのリダイレクト
          router.replace(redirect);
        } else { // 通常のログイン時
          router.push('/?logged-in=1');
        }
        router.refresh(); // ヘッダー更新のためWebページを再読み込み
      } else { // ログイン失敗時はエラー情報を表示
        setErrorMessage(data.message || 'ログインに失敗しました。');
      }
    } catch {
      setErrorMessage('通信エラーが発生しました。');
    }
  };

  // 入力欄の共通スタイル
  const inputStyle = 'w-full border border-gray-300 px-3 py-2 rounded-sm focus:ring-2 focus:ring-indigo-500';
  // ラベルの共通スタイル
  const labelStyle = "block font-bold mb-1";
  // バッジの共通スタイル
  const badgeStyle = "ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-md";

  return (
    <main className="max-w-md mx-auto py-10">
      <h1 className="text-center mb-6">ログイン</h1>
      {errorMessage && (
        <p className="text-red-600 text-center mb-4">{errorMessage}</p>
      )}
      <form onSubmit={handleSubmit} className="w-full space-y-6 p-8 bg-white shadow-lg rounded-xl ">
        <label className={labelStyle} htmlFor="email">
          メールアドレス<span className={badgeStyle}>必須</span>
        </label>
        <input type="email" id="email" name="email" required
          className={inputStyle}
        />

        <label className={labelStyle} htmlFor="password">
          パスワード<span className={badgeStyle}>必須</span>
        </label>
        <input type="password" id="password" name="password" required
          className={inputStyle}
        />

        <button type="submit" className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-sm font-semibold">
          ログイン
        </button>
      </form>
      <form onSubmit={handleSubmit} className="w-full space-y-6 p-8 bg-white shadow-lg rounded-xl mt-6">
        <input type="hidden" id="email" name="email" value="hanako.samurai@example.com" required className={inputStyle}/>
        <input type="hidden" id="password" name="password" value="password" required className={inputStyle}/>
        <button type="submit" className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-sm font-semibold">
          仮管理者アカウントでログイン
        </button>
      </form>
    </main>
  );
}