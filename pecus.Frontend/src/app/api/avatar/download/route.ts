import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedAxios } from "@/connectors/api/PecusApiClient";

/**
 * アバター画像ダウンロードAPI Route
 * GET /api/avatar/download?fileType=Avatar&resourceId={userId}&fileName={fileName}&useOriginal=true
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
        { status: 400 }
      );
    }

    // 認証済みAxiosインスタンスを作成
    const axios = await createAuthenticatedAxios();

    // バイナリデータとしてダウンロード（responseType: 'arraybuffer'）
    const response = await axios.get("/api/downloads/icons", {
      params: {
        FileType: fileType,
        ResourceId: parseInt(resourceId),
        FileName: fileName,
        UseOriginal: useOriginal,
      },
      responseType: "arraybuffer",
    });

    // Content-Typeを推測（拡張子から）
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeType =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "gif"
            ? "image/gif"
            : ext === "webp"
              ? "image/webp"
              : "image/jpeg";

    // バイナリデータを直接返す（Content-Dispositionでダウンロードさせる）
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
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
      { status: error.response?.status || 500 }
    );
  }
}
