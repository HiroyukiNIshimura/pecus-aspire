import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedAxios } from "@/connectors/api/PecusApiClient";

/**
 * アバター画像取得API Route
 * GET /api/avatar?fileType=Avatar&resourceId={userId}&fileName={fileName}
 *
 * Server Actionsでは読み取り操作（GET）を行わない方針に従い、
 * バイナリデータのダウンロードはAPI Routeで実装
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileType = searchParams.get("fileType");
    const resourceId = searchParams.get("resourceId");
    const fileName = searchParams.get("fileName");

    if (!fileType || !resourceId || !fileName) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // 認証済みAxiosインスタンスを作成
    // Note: OpenAPI自動生成クライアントはバイナリデータ（ArrayBuffer）のダウンロードに非対応のため、
    //       画像などのバイナリファイル取得は直接Axiosを使用してresponseType: 'arraybuffer'を指定
    const axios = await createAuthenticatedAxios();

    // バイナリデータとしてダウンロード（responseType: 'arraybuffer'）
    const response = await axios.get("/api/downloads/icons", {
      params: {
        FileType: fileType,
        ResourceId: parseInt(resourceId),
        FileName: fileName,
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

    // ArrayBufferをBase64に変換
    const base64 = Buffer.from(response.data).toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (error: any) {
    console.error("Failed to fetch avatar:", error);

    // 認証エラーの場合は401を返す
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 404エラーの場合
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to fetch avatar" },
      { status: error.response?.status || 500 }
    );
  }
}
