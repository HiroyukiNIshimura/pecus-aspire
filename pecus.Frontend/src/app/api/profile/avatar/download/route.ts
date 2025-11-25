import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedAxios } from "@/connectors/api/PecusApiClient";

/**
 * アバター画像ダウンロードAPI Route
 * GET /api/profile/avatar/download?fileType=Avatar&resourceId={userId}&fileName={fileName}&useOriginal=true
 *
 * バイナリデータを直接ダウンロードさせるためのエンドポイント
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileType = searchParams.get("fileType");
    const resourceId = searchParams.get("resourceId");
    const fileName = searchParams.get("fileName");
    const useOriginal = searchParams.get("useOriginal") === "true";

    if (!fileType || !resourceId || !fileName) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // 認証済みAxiosインスタンスを作成
    const axios = await createAuthenticatedAxios();

    // バックエンドの新しいルートベースエンドポイントにアクセス
    const backendUrl = `/api/downloads/${fileType.toLowerCase()}/${resourceId}/${encodeURIComponent(fileName)}`;

    const response = await axios.get(backendUrl, {
      params: useOriginal ? { useOriginal: true } : undefined,
      responseType: "arraybuffer",
    });

    // バックエンドから返されるContent-Typeを取得
    const contentType = response.headers["content-type"] || "image/jpeg";

    // Content-Typeから適切な拡張子を判定
    const extMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
    };
    const detectedExt = extMap[contentType] || ".jpg";

    // 元のファイル名から拡張子を除去
    const baseFileName = fileName.replace(/\.[^/.]+$/, "");

    // 正しい拡張子でファイル名を生成
    const downloadFileName = `${baseFileName}${detectedExt}`;

    // バイナリデータを直接返す（Content-Dispositionでダウンロードさせる）
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${downloadFileName}"`,
      },
    });
  } catch (error: any) {
    console.error("Failed to download avatar:", error);

    // 認証エラーの場合は401を返す
    if (error.response?.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 404エラーの場合
    if (error.response?.status === 404) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || "Failed to download avatar" },
      { status: error.response?.status || 500 },
    );
  }
}
