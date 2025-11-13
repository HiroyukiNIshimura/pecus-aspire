import { NextRequest, NextResponse } from "next/server";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";

export const dynamic = "force-dynamic";

/**
 * ワークスペース一覧取得APIルート
 * GET /api/workspaces?page={page}&IsActive={bool}&Name={string}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const isActiveParam = searchParams.get("IsActive");
    const name = searchParams.get("Name") || undefined;

    // クエリパラメータを整形
    const isActive =
      isActiveParam === null
        ? undefined
        : isActiveParam === "true"
          ? true
          : isActiveParam === "false"
            ? false
            : undefined;

    // API クライアント生成
    const clients = await createPecusApiClients();

    // ワークスペース一覧取得
    const response = await clients.workspace.getApiWorkspaces(
      page,
      isActive,
      undefined, // genreId（現在未使用）
      name,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to fetch workspaces:", error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: "認証が必要です。" },
        { status: 401 },
      );
    }

    if (error.status === 403) {
      return NextResponse.json(
        { error: "アクセス権限がありません。" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: error.message || "ワークスペース一覧の取得に失敗しました。" },
      { status: error.status || 500 },
    );
  }
}
