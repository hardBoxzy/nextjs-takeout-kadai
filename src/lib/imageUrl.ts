// DBのimage_urlの値から表示用の画像URLを返す（クライアント・サーバー共通）
// - 完全なURL（S3に保存した画像）：そのまま使用
// - ファイル名のみ（public/uploads内の画像）：/uploads/ を付与
// - 未設定：ダミー画像
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/images/no-image.jpg';
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  return `/uploads/${imageUrl}`;
}
