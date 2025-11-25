import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedAxios } from "@/connectors/api/PecusApiClient";

export const dynamic = "force-dynamic";

/**
 * ファイル名を安全なASCII互換の形式に変換
 * 非ASCII文字（日本語など）を含む場合はタイムスタンプベースの名前を生成
 * @param originalName 元のファイル名
 * @returns 安全なファイル名
 */
function getSafeFileName(originalName: string): string {
  // 拡張子を取得
  const lastDotIndex = originalName.lastIndexOf(".");
  const extension = lastDotIndex > 0 ? originalName.slice(lastDotIndex) : "";
  const baseName =
    lastDotIndex > 0 ? originalName.slice(0, lastDotIndex) : originalName;

  // ASCII文字のみかチェック（制御文字も除外）
  // eslint-disable-next-line no-control-regex
  const isAsciiSafe = /^[\x20-\x7E]+$/.test(baseName);

  if (isAsciiSafe) {
    // ASCII文字のみの場合はそのまま返す（スペースはアンダースコアに変換）
    return baseName.replace(/\s+/g, "_") + extension;
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id, itemId } = await params;
    const workspaceId = parseInt(id, 10);
    const workspaceItemId = parseInt(itemId, 10);

    if (isNaN(workspaceId) || isNaN(workspaceItemId)) {
      return NextResponse.json(
        { error: "無効なワークスペースIDまたはアイテムIDです。" },
        { status: 400 },
      );
    }

    // FormData からファイルを取得
    const clientFormData = await request.formData();
    const file = clientFormData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが指定されていません。" },
        { status: 400 },
      );
    }

    // 認証済みAxiosインスタンスを作成
    // Note: OpenAPI自動生成クライアントはNode.js環境でのFormData/Fileオブジェクト処理に非対応のため、
    //       ファイルアップロードは直接Axiosを使用してFormDataを送信する
    const axios = await createAuthenticatedAxios();

    // FormDataを作成（Node.js環境でも動作するFormData）
    const FormData = (await import("form-data")).default;
    const formData = new FormData();

    // FileをArrayBufferに変換してBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ファイル名を安全な形式に変換（非ASCII文字を含む場合はエンコード）
    // Content-Dispositionヘッダーで非ASCII文字はエラーになるため、
    // 拡張子のみ保持してタイムスタンプベースの名前を生成
    const safeFileName = getSafeFileName(file.name);

    formData.append("file", buffer, {
      filename: safeFileName,
      contentType: file.type,
    });

    // Axiosで直接POSTリクエスト
    const response = await axios.post(
      `/api/workspaces/${workspaceId}/items/${workspaceItemId}/attachments`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      },
    );

    // アップロード成功後、画像をDataURL形式で取得
    // 認証が必要なエンドポイントのため、サーバー側でDataURLに変換して返す
    let dataUrl = "";
    const downloadUrl = response.data.downloadUrl as string | undefined;

    if (downloadUrl) {
      try {
        // 認証済みAxiosで画像をダウンロード
        const imageResponse = await axios.get(downloadUrl, {
          responseType: "arraybuffer",
        });

        // MIMEタイプを取得（レスポンスヘッダーまたはアップロード時のタイプを使用）
        const contentType =
          imageResponse.headers["content-type"] || file.type || "image/png";

        // ArrayBufferをBase64に変換してDataURLを生成
        const base64 = Buffer.from(imageResponse.data).toString("base64");
        dataUrl = `data:${contentType};base64,${base64}`;
      } catch (imageError) {
        console.error("Failed to fetch image for DataURL:", imageError);
        // DataURL取得に失敗しても、アップロード自体は成功しているのでエラーにしない
      }
    }

    return NextResponse.json({
      url: dataUrl || downloadUrl || "",
      fileName: response.data.fileName || "",
      id: response.data.id,
    });
  } catch (error: any) {
    console.error("Failed to upload image:", error);

    const status = error.response?.status || error.status;

    if (status === 401) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    if (status === 403) {
      return NextResponse.json(
        { error: "アクセス権限がありません。" },
        { status: 403 },
      );
    }

    if (status === 404) {
      return NextResponse.json(
        { error: "ワークスペースまたはアイテムが見つかりません。" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.message ||
          "画像のアップロードに失敗しました。",
      },
      { status: status || 500 },
    );
  }
}
