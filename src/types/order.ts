export const orderStatus = ['未処理', '処理中', '出荷済み', '完了', 'キャンセル', '返金済み'] as const;
export type OrderStatus = typeof orderStatus[number];

// paymentStatus も同様にこちらへ移動
export const paymentStatus = ['未決済', '決済処理中', '決済成功', '決済失敗', '返金処理中', '返金済み'] as const;
export type PaymentStatus = typeof paymentStatus[number];

// 最終的なレスポンス（商品明細を配列化した注文データ）の型定義
export interface OrderData {
  id: number;
  totalPrice: number;
  userName: string;
  phoneNumber: string;
  notes: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  pickupAt: string;
  items: OrderItem[]; // 商品明細の配列
}

// 注文ごとの商品データの型定義
export interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}


export interface OrderJoinRecord extends Omit<OrderData, 'items'>, OrderItem {}
/*OrderData とOrderItemを結合
Omitとextendsを組み合わせてinterfaceにする
生成される新しい型のイメージ：
{
  id: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  pickupAt: string;
  productName: string;  <-- 合体
  quantity: number;     <-- 合体
  unitPrice: number;    <-- 合体
}*/