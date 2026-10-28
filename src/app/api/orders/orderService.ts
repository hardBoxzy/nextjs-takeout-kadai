import { executeQuery } from '@/lib/db';
import { CartItem } from '@/hooks/useCart';
import { type ResultSetHeader } from 'mysql2/promise';
import { use } from 'react';
import {  OrderStatus, PaymentStatus} from '@/types/order';

// 注文確定前の在庫チェック
export async function checkStock(cartItems: CartItem[]): Promise<string[]> {
  // 不足商品リスト
  const shortageItems: string[] = [];

  // すべてのアイテムを順番にチェック
  for (const item of cartItems) {
    const result = await executeQuery<{ name: string, stock: number }>(
      `SELECT name, stock FROM products WHERE id = ? LIMIT 1;`,
      [item.id]
    );
    const product = result[0];
    // 商品が存在しない、または在庫不足なら不足商品リストに追加
    if (!product || (product.stock ?? 0) < item.quantity) {
      shortageItems.push(product?.name || `ID:${item.id}`);
    }
  }

  // 不足商品リストを返す（なければ空配列）
  return shortageItems;
}

// 注文データを新規登録
export async function createOrder(userId: number | null, cartItems: CartItem[], 
 userName: string,totalPrice: number,phoneNumber: string,
  notes: string| null, pickupAt: string): Promise<number> {
  if (!Array.isArray(cartItems) || cartItems.length === 0) throw new Error('カートが空です。');
  if (isNaN(totalPrice) || totalPrice <= 0) throw new Error('合計金額が不正です。');
  if (!userId){userId = null;}
  if (!notes){notes = null;}
  const formattedPickupAt = pickupAt ? `${pickupAt}:00` : null; // "2026-10-27 12:15:00" に変換
  console.log( `pickupAt:${pickupAt}`)
  // 注文情報をordersテーブルに追加
  const result = await executeQuery<{ insertId: number }>(`
    INSERT INTO orders (user_id, total_price, status, payment_status, user_name, phone_number,
    notes, pickup_at)
    VALUES (?, ?, '未処理', '未決済', ?,?,
    ?,?);`,
    [userId, totalPrice,userName,phoneNumber,notes,formattedPickupAt]
  ) as unknown as ResultSetHeader; // 単一オブジェクトとして型変換
  // 追加したデータの注文IDを取得
  const orderId = result.insertId;
  if (!orderId) throw new Error('注文登録に失敗しました。');

  // 注文明細をorder_itemsテーブルに追加
  for (const product of cartItems) {
    await executeQuery(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price )
      VALUES (?, ?, ?, ?, ?);`,
      [orderId, product.id, product.title, product.quantity, product.price]);
  }

    // 商品の在庫数と販売数を更新
    // 注文IDに紐づく商品のIDと注文数を取得
    const orderItems = await executeQuery<{ product_id: number; quantity: number }>(
      `SELECT product_id, quantity FROM order_items WHERE order_id = ?;`,
      [orderId]
    );
    // 購入された商品の在庫数と販売数を順番に更新
    for (const item of orderItems) {
      await executeQuery(`
        UPDATE products
        SET stock = stock - ?, sales_count = sales_count + ?, updated_at = NOW()
        WHERE id = ?;`,
        [item.quantity, item.quantity, item.product_id]
      );
    }

  // 注文IDを返す
  return orderId;
}

// 指定IDの注文データを更新
export async function updateOrder( orderId: number, status?: string, paymentStatus?: string) {
  if (!orderId) throw new Error('注文IDが必要です。');
  // 更新するカラムと値を組み立てる
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (status) { // 注文ステータス更新
    fields.push('status = ?');
    values.push(status);
  }
  if (paymentStatus) { // 決済ステータス更新
    fields.push('payment_status = ?');
    values.push(paymentStatus);
  }

  if (fields.length === 0) return; // 更新対象なし

  // WHERE句に指定する注文IDとユーザーIDを追加
  values.push(orderId);

 // ordersテーブルの注文情報を更新
  const result = await executeQuery<ResultSetHeader>(`
    UPDATE orders
    SET ${fields.join(', ')}
    WHERE id = ? ;`,
    values
  ) as unknown as ResultSetHeader; // 単一オブジェクトとして型変換

}