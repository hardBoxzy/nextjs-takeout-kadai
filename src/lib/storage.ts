// サーバー側（APIルート）専用のモジュール
import path from 'path';
import { writeFile, rm } from 'fs/promises';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// 許可する画像の拡張子とContent-Type
const ALLOWED_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

// S3の設定（環境変数がすべて揃っている場合のみS3を使用）
// 認証情報(AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)はSDKが環境変数から自動で読み込む
const bucket = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_REGION;
const useS3 = Boolean(bucket && region && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const s3 = useS3 ? new S3Client({ region }) : null;

// S3上の保存先フォルダ
const S3_PREFIX = 'uploads/';
// S3の公開URLのベース
const s3BaseUrl = `https://${bucket}.s3.${region}.amazonaws.com/`;

// ローカル保存先（開発環境用）
const LOCAL_DIR = path.join(process.cwd(), 'public/uploads');

// 拡張子をチェックして返す（不正な場合はnull）
export function getValidExtension(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext && ALLOWED_TYPES[ext] ? ext : null;
}

/**
 * 画像を保存し、DBのimage_urlに保存する値を返す
 * - S3使用時：画像の完全なURL（https://...）
 * - ローカル時：ファイル名のみ
 */
export async function saveImage(file: File, ext: string): Promise<string> {
  // 重複しないファイル名を生成
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const fileName = `${timestamp}_${random}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (s3) {
    const key = `${S3_PREFIX}${fileName}`;
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: ALLOWED_TYPES[ext],
    }));
    return `${s3BaseUrl}${key}`;
  }

  await writeFile(path.join(LOCAL_DIR, fileName), buffer);
  return fileName;
}

/**
 * 保存済みの画像を削除する（失敗してもエラーは投げずにログのみ）
 */
export async function deleteImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;
  try {
    if (imageUrl.startsWith('http')) {
      // S3上の画像：自バケットのURLのみ削除対象
      if (!s3 || !imageUrl.startsWith(s3BaseUrl)) return;
      const key = decodeURIComponent(imageUrl.slice(s3BaseUrl.length));
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } else {
      // ローカルの画像（パストラバーサル防止のためファイル名部分のみ使用）
      await rm(path.join(LOCAL_DIR, path.basename(imageUrl)));
    }
  } catch (err) {
    console.error('画像ファイル削除エラー：', err);
  }
}
