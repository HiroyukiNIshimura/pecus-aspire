import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ワークスペースアイテム一覧取得 API Route
 * GET /api/workspaces/[id]/items?page=1
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);
    const page = request.nextUrl.searchParams.get("page")
      ? parseInt(request.nextUrl.searchParams.get("page")!, 10)
      : 1;

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const api = createPecusApiClients();
    const response = await api.workspace.getApiWorkspacesItems(
      workspaceId,
      page
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to fetch workspace items:", error);

    // 404 エラーの場合
    if (error.status === 404) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // その他のエラー
    return NextResponse.json(
      { error: error.message || "Failed to fetch workspace items" },
      { status: 500 }
    );
  }
}
