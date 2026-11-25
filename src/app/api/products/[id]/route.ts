import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db'; // DB共通モジュール
import { getValidExtension, saveImage, deleteImage } from '@/lib/storage'; // 画像保存モジュール
import { type ProductData } from '@/types/product';

// 商品データの型定義
type Product = ProductData; // 基本型から変更なし

// 指定IDの商品データを取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // URLのパラメータからIDを取得
  const { id } = await context.params;

  // IDを数値に変換
  const productId = parseInt(id, 10);

   try { // DBから商品データを取得
    const result = await executeQuery<Product>(
      'SELECT * FROM products WHERE id = ?;',
      [productId]
    );

    // 指定IDの商品が見つからなかった場合
    if (result.length === 0) {
      return NextResponse.json(
        { message: '商品が見つかりませんでした。' },
        { status: 404 }
      );
    }

    // 取得した商品データを返却
    return NextResponse.json(result[0]);
  } catch (err) {
    console.error('商品取得エラー：', err);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。' },
      { status: 500 }
    );
  }
}

// 指定IDの商品データを更新
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // URLのパラメータからIDを取得
  const { id } = await context.params;

  // IDを数値に変換
  const productId = parseInt(id, 10);

  try {
    // 既存の商品データを取得（存在確認）
    const existing = await executeQuery<Product>(
      'SELECT * FROM products WHERE id = ?;',
      [productId]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { message: '商品が見つかりませんでした。' },
        { status: 404 }
      );
    }
    const currentProduct = existing[0]; // 現状の商品データを取得

    // 画像ファイルを含むフォームデータを取得
    const formData = await request.formData();
    const name = formData.get('name')?.toString().trim() || '';
    const file = formData.get('imageFile') as File | null;
    const description = formData.get('description')?.toString().trim() || '商品の説明がありません。';
    const price = Number(formData.get('price'));
    const stock = Number(formData.get('stock'));
    const isFeatured = formData.get('isFeatured') === 'on';

    // 入力値のバリデーション（画像ファイルなしは許容）
    if (!name?.trim() || isNaN(price) || isNaN(stock)) {
      return NextResponse.json({ message: '必須項目が不足しています。' }, { status: 400 });
    }

    // 新旧の画像URL
    const oldImageUrl = currentProduct.image_url;
    let newImageUrl = oldImageUrl; // 暫定的に既存の画像

    // 新しい画像ファイルがアップロードされた場合
    const hasNewImage = Boolean(file && file.size > 0);
    if (file && hasNewImage) {
      // 拡張子を安全に取得
      const ext = getValidExtension(file);
      if (!ext) {
        return NextResponse.json({ message: '対応していないファイル形式です。' }, { status: 400 });
      }

      // 新しい画像を保存（本番はS3、開発はpublic/uploads）
      newImageUrl = await saveImage(file, ext);
    }

    // 商品情報をproductsテーブルで更新
    try {
      await executeQuery(`
        UPDATE products
        SET name = ?, image_url = ?, description = ?, price = ?, stock = ?, is_featured = ?
        WHERE id = ?;
      `, [name, newImageUrl ?? null, description, price, stock, isFeatured ? 1 : 0, productId]);
    } catch (err) {
      if (hasNewImage) await deleteImage(newImageUrl); // 更新失敗時は新しい画像を削除
      throw err;
    }

    // DB更新に成功したら古い画像を削除
    if (hasNewImage) {
      await deleteImage(oldImageUrl);
    }

    return NextResponse.json({ message: '商品を編集しました。' }, { status: 200 });
  } catch (err) {
    console.error('商品更新エラー：', err);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}

// 指定IDの商品データを削除
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // URLのパラメータからIDを取得
  const { id } = await context.params;

  // IDを数値に変換
  const productId = parseInt(id, 10);

  try {
    // 既存の商品データを取得（存在確認）
    const existing = await executeQuery<Product>(
      'SELECT * FROM products WHERE id = ?;',
      [productId]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { message: '商品が見つかりませんでした。' },
        { status: 404 }
      );
    }
    const currentProduct = existing[0]; // 現状の商品データを取得

    // DBから商品を削除
    await executeQuery(
      'DELETE FROM products WHERE id = ?;',
      [productId]
    );

    // 画像ファイルがあれば削除（S3またはローカル）
    await deleteImage(currentProduct.image_url);

    return NextResponse.json({ message: '商品を削除しました。' }, { status: 200 });
  } catch (err) {
    console.error('商品削除エラー：', err);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。' },
      { status: 500 }
    );
  }
}