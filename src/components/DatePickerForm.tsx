'use client'; // クライアント（ブラウザ）側で動作

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// TypeScriptで window.flatpickr を扱えるように型拡張
declare global {
  interface Window {
    flatpickr: any;
  }
}
// 1. Propsの型定義を追加
interface DatePickerFormProps {
  onDateChange: (dateStr: string) => void;
}
export default function DatePickerForm({ onDateChange }: DatePickerFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // 1. 本体とロケール、それぞれの読込状態を管理
  const [isCoreLoaded, setIsCoreLoaded] = useState(false);
  const [isLocaleLoaded, setIsLocaleLoaded] = useState(false);
  const fpInstance = useRef<any>(null);

  useEffect(() => {
    // スクリプト読み込み完了かつ要素が存在すれば初期化
    if (isCoreLoaded && isLocaleLoaded && inputRef.current && window.flatpickr) {
      fpInstance.current = window.flatpickr(inputRef.current, {
        inline: true,
        locale: "ja", // 日本語化
        minDate: 'today',
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        onChange: (selectedDates: Date[], dateStr: string) => {
          onDateChange(dateStr); // 親コンポーネントに選択された文字列を渡す
        },
      });
    }

    // アンマウント時にカレンダーを破棄
    return () => {
      if (fpInstance.current) {
        fpInstance.current.destroy();
      }
    };
  }, [isCoreLoaded, isLocaleLoaded, onDateChange]);

  return (
    <div style={{ padding: "20px" }}>
      {/* 1. flatpickrのCSSファイルをCDNから読み込む */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css"
      />

      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="date-input">日付を選択: </label>
        <input
          id="date-input"
          type="text"
          ref={inputRef}
          placeholder="日付を選択してください"
        />
      </form>

      {/* 3. flatpickr本体の読み込み */}
      <Script
        src="https://cdn.jsdelivr.net/npm/flatpickr"
        strategy="afterInteractive"
        onLoad={() => setIsCoreLoaded(true)}
      />

      {/* 4. 日本語ロケールの読み込み (本体がロードされてから読み込む、または完了タイミングをキャッチ) */}
      <Script
        src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/ja.js"
        strategy="afterInteractive"
        onLoad={() => setIsLocaleLoaded(true)}
      />
    </div>
  );
}