import { NextResponse } from 'next/server';

const JWT_COOKIE = 'authToken';// JWTのクッキー名
export async function POST() {// ログアウト処理
  try {
    const response = NextResponse.redirect(    // トップページへリダイレクト
      new URL('/?logged-out=1', process.env.BASE_URL)
    );
    response.cookies.delete({    // クッキーを削除
      name: JWT_COOKIE,
      path: '/', // ログイン時に設定したパスと一致させる
    });
    return response;
  } catch (error) {
    console.error('ログアウトAPIエラー：', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}