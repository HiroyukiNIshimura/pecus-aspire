import { NextResponse } from 'next/server';

// このファイルは後方互換性のために残しています。
// アップロード処理は Server Action (uploadWorkspaceItemAttachment) に移行しました。
// ダウンロードは [fileName]/route.ts で処理されます。

export const dynamic = 'force-dynamic';

/**
 * POST リクエストは Server Action に移行済み
 * このエンドポイントは非推奨
 */
export async function POST() {
  return NextResponse.json(
    { error: 'このエンドポイントは非推奨です。Server Actionを使用してください。' },
    { status: 410 },
  );
}
