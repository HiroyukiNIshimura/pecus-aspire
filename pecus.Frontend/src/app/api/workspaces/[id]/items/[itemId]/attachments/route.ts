import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { createAuthenticatedAxios } from '@/connectors/api/PecusApiClient';

export const dynamic = 'force-dynamic';

/**
 * ファイル名を安全なASCII互換の形式に変換
 * 非ASCII文字（日本語など）を含む場合はタイムスタンプベースの名前を生成
 * @param originalName 元のファイル名
 * @returns 安全なファイル名
 */
function getSafeFileName(originalName: string): string {
  // 拡張子を取得
  const lastDotIndex = originalName.lastIndexOf('.');
  const extension = lastDotIndex > 0 ? originalName.slice(lastDotIndex) : '';
  const baseName = lastDotIndex > 0 ? originalName.slice(0, lastDotIndex) : originalName;

  // ASCII文字のみかチェック（制御文字も除外）
  // eslint-disable-next-line no-control-regex
  const isAsciiSafe = /^[\x20-\x7E]+$/.test(baseName);

  if (isAsciiSafe) {
    // ASCII文字のみの場合はそのまま返す（スペースはアンダースコアに変換）
    return baseName.replace(/\s+/g, '_') + extension;
  }

  // 非ASCII文字を含む場合はタイムスタンプベースの名前を生成
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `upload_${timestamp}_${randomSuffix}${extension}`;
}

/**
 * ワークスペースアイテムへの画像アップロードAPIルート
 * POST /api/workspaces/{id}/items/{itemId}/attachments
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const { id, itemId } = await params;
    const workspaceId = parseInt(id, 10);
    const workspaceItemId = parseInt(itemId, 10);

    if (Number.isNaN(workspaceId) || Number.isNaN(workspaceItemId)) {
      return badRequestError('無効なワークスペースIDまたはアイテムIDです。');
    }

    // FormData からファイルを取得
    const clientFormData = await request.formData();
    const file = clientFormData.get('file') as File | null;

    if (!file) {
      return badRequestError('ファイルが指定されていません。');
    }

    // 認証済みAxiosインスタンスを作成
    // Note: OpenAPI自動生成クライアントはNode.js環境でのFormData/Fileオブジェクト処理に非対応のため、
    //       ファイルアップロードは直接Axiosを使用してFormDataを送信する
    const axios = await createAuthenticatedAxios();

    // FormDataを作成（Node.js環境でも動作するFormData）
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    // FileをArrayBufferに変換してBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ファイル名を安全な形式に変換（非ASCII文字を含む場合はエンコード）
    // Content-Dispositionヘッダーで非ASCII文字はエラーになるため、
    // 拡張子のみ保持してタイムスタンプベースの名前を生成
    const safeFileName = getSafeFileName(file.name);

    formData.append('file', buffer, {
      filename: safeFileName,
      contentType: file.type,
    });

    // 元のファイル名を別フィールドとして送信（DBに保存される表示用ファイル名）
    formData.append('originalFileName', file.name);

    // Axiosで直接POSTリクエスト
    const response = await axios.post(`/api/workspaces/${workspaceId}/items/${workspaceItemId}/attachments`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // バックエンドの downloadUrl からファイル名を抽出してプロキシURLを生成
    // downloadUrl 形式: /api/workspaces/{workspaceId}/items/{itemId}/attachments/download/{fileName}
    const downloadUrl = response.data.downloadUrl as string | undefined;
    let proxyUrl = '';

    if (downloadUrl) {
      // downloadUrl からファイル名部分を抽出
      const urlParts = downloadUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Next.js API Route のプロキシURLを生成
      // /api/workspaces/{id}/items/{itemId}/attachments/{fileName}
      proxyUrl = `/api/workspaces/${workspaceId}/items/${workspaceItemId}/attachments/${fileName}`;
    }

    return NextResponse.json({
      url: proxyUrl,
      fileName: response.data.fileName || '',
      id: response.data.id,
    });
  } catch (error) {
    console.error('Failed to upload image:', error);
    return parseRouterError(error, '画像のアップロードに失敗しました');
  }
}
