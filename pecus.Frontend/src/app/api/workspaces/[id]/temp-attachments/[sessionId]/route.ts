import { type NextRequest, NextResponse } from "next/server";
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
 * 一時ファイルアップロードAPIルート（新規アイテム作成用）
 * POST /api/workspaces/{id}/temp-attachments/{sessionId}
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const { id, sessionId } = await params;
    const workspaceId = parseInt(id, 10);

    if (Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { error: "無効なワークスペースIDです。" },
        { status: 400 },
      );
    }

    if (!sessionId || sessionId.length === 0 || sessionId.length > 50) {
      return NextResponse.json(
        { error: "無効なセッションIDです。" },
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
    const axios = await createAuthenticatedAxios();

    // FormDataを作成（Node.js環境でも動作するFormData）
    const FormData = (await import("form-data")).default;
    const formData = new FormData();

    // FileをArrayBufferに変換してBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ファイル名を安全な形式に変換
    const safeFileName = getSafeFileName(file.name);

    formData.append("file", buffer, {
      filename: safeFileName,
      contentType: file.type,
    });

    // バックエンドの一時ファイルアップロードAPIを呼び出し
    const response = await axios.post(
      `/api/workspaces/${workspaceId}/temp-attachments/${sessionId}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      },
    );

    // バックエンドからのレスポンスをプロキシURL形式に変換
    const backendPreviewUrl = response.data.previewUrl as string | undefined;
    let proxyPreviewUrl = "";

    if (backendPreviewUrl) {
      // バックエンドのURLからファイル名を抽出
      // previewUrl 形式: /api/workspaces/{workspaceId}/temp-attachments/{sessionId}/{fileName}
      const urlParts = backendPreviewUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // Next.js API Route のプロキシURLを生成
      proxyPreviewUrl = `/api/workspaces/${workspaceId}/temp-attachments/${sessionId}/${fileName}`;
    }

    return NextResponse.json({
      tempFileId: response.data.tempFileId,
      sessionId: response.data.sessionId,
      fileName: response.data.fileName,
      fileSize: response.data.fileSize,
      mimeType: response.data.mimeType,
      previewUrl: proxyPreviewUrl,
    });
  } catch (error: any) {
    console.error("Failed to upload temp file:", error);

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
        { error: "ワークスペースが見つかりません。" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.message ||
          "一時ファイルのアップロードに失敗しました。",
      },
      { status: status || 500 },
    );
  }
}

/**
 * 一時ファイルセッション削除APIルート（クリーンアップ用）
 * DELETE /api/workspaces/{id}/temp-attachments/{sessionId}
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const { id, sessionId } = await params;
    const workspaceId = parseInt(id, 10);

    if (Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { error: "無効なワークスペースIDです。" },
        { status: 400 },
      );
    }

    if (!sessionId || sessionId.length === 0 || sessionId.length > 50) {
      return NextResponse.json(
        { error: "無効なセッションIDです。" },
        { status: 400 },
      );
    }

    // 認証済みAxiosインスタンスを作成
    const axios = await createAuthenticatedAxios();

    // バックエンドの一時ファイルクリーンアップAPIを呼び出し
    await axios.delete(
      `/api/workspaces/${workspaceId}/temp-attachments/${sessionId}`,
    );

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Failed to cleanup temp files:", error);

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
        { error: "ワークスペースが見つかりません。" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.message ||
          "一時ファイルのクリーンアップに失敗しました。",
      },
      { status: status || 500 },
    );
  }
}
