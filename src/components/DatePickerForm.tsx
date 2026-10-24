"use client";

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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const fpInstance = useRef<any>(null);

  useEffect(() => {
    // スクリプト読み込み完了かつ要素が存在すれば初期化
    if (isScriptLoaded && inputRef.current && window.flatpickr) {
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
  }, [isScriptLoaded]);

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

      {/* 2. flatpickr本体と日本語用ロケールファイルをCDNから読み込む */}
      <Script
        src="https://cdn.jsdelivr.net/npm/flatpickr"
        strategy="afterInteractive"
        onLoad={() => {
          // 本体が読み終わったら日本語ファイルを動的に追加するか、状態を更新
          setIsScriptLoaded(true);
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/ja.js"
        strategy="afterInteractive"
      />
    </div>
  );
}