import { NextRequest, NextResponse } from 'next/server';
import { checkStock, createOrder, updateOrder } from '@/app/api/orders/orderService';
import { getAuthUser, type AuthUser } from '@/lib/auth';
import { CartItem } from '@/hooks/useCart';
import { executeQuery } from '@/lib/db';
import {  OrderStatus, PaymentStatus} from '@/types/order';
// Checkoutセッションを作成
export async function POST(request: NextRequest) {
  try {
    // リクエストボディからカート情報とお届け先を取得
    const { items,userName ,phoneNumber,notes,pickupAt}: {
      items: CartItem[];
      userName: string;
      phoneNumber: string;
      notes: string| null;
      pickupAt: string;
    } = await request.json();

    // 在庫チェック
    const shortageItems = await checkStock(items);

    if (shortageItems.length > 0) {
      return NextResponse.json({ message: `在庫不足の商品があります：${shortageItems.join('、')}` }, { status: 400 });
    }
   // データベースに保存された商品データを取得
    const productIds = items.map(item => item.id);
    if (productIds.length === 0) {
      return NextResponse.json({ message: '商品が選択されていません。' }, { status: 400 });
    }

    const placeholders = productIds.map(() => '?').join(','); // ?,?,?...
    const products = await executeQuery<{ id: number; name: string; price: number }>(`
      SELECT id, name, price
      FROM products
      WHERE id IN (${placeholders});
    `, productIds); // リストに含まれる商品データをまとめて取得

    if (products.length === 0) {
      return NextResponse.json({ message: '商品が見つかりませんでした。' }, { status: 404 });
    }

    let totalPrice = 0; // 合計金額
    const line_items = items.map(item => {
      // 合計金額はデータベース情報をもとにサーバー側で計算（改ざん対策）
      const product = products.find(p => p.id === Number(item.id));
      if (!product) throw new Error(`商品ID ${item.id} が見つかりません。`);

      // 商品ごとの小計を求め、合計金額に加算
      const subtotal = product.price * item.quantity;
      totalPrice += subtotal;
      return {
        price_data: {
          currency: 'jpy', // 日本円
          product_data: { name: product.name }, // 商品名
          unit_amount: product.price, // 単価（円）
        },
        quantity: item.quantity, // 数量
      };
    });


    // 認証済みユーザーの取得
    const user: AuthUser | null = await getAuthUser();
    const userId = user ? user.userId : null;

    // カート内の価格情報をデータベースの登録内容で上書き（改ざん対策）
    const correctPriceItems = items.map(item => {
      const product = products.find(p => p.id === Number(item.id));
      if (!product) throw new Error(`商品ID ${item.id} が見つかりません。`);
      return { ...item, price: product.price };
    });
    
    // データベースに注文データを仮登録
    const orderId = await createOrder(userId, correctPriceItems, userName, totalPrice,phoneNumber,notes,pickupAt);
    // await updateOrder(userId, Number(orderId), '処理中', '決済成功');

    const successUrl = `${request.nextUrl.origin}/?session_id={CHECKOUT_SESSION_ID}`;
    // フロントエンドにStripeのURLを返す
    return NextResponse.json({ url: successUrl }, { status: 200 });
  } catch (err) {
    console.error('注文・決済処理エラー：', err);
    return NextResponse.json({ message: '注文登録または決済処理に失敗しました。' }, { status: 500 });
  }
}

// Webhookイベントの処理
export async function PUT(request: NextRequest) {
      // リクエストボディからカート情報とお届け先を取得
    const { orderId,newStatus ,newPaymentStatus}: {
      orderId: number;
      newStatus?: string;
      newPaymentStatus?: string;
    } = await request.json();

    try { // 注文データを本登録（注文ステータス：処理中、決済ステータス：決済成功）
      // console.log( "backend route:");
      // console.log( Number(orderId), newStatus, paymentStatus);
      await updateOrder( Number(orderId), newStatus, newPaymentStatus);
    } catch (err) {
      console.error('注文ステータス更新エラー：', err);
      return NextResponse.json({ message: '注文ステータス更新に失敗しました。' }, { status: 500 });
    }

  // Webhookの受信を通知（処理成功/失敗にかかわらず送る）
  return NextResponse.json({ received: true }, { status: 200 });
}