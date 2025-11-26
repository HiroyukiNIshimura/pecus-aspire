import { type NextRequest, NextResponse } from "next/server";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);

    if (isNaN(workspaceId) || workspaceId <= 0) {
      return NextResponse.json(
        { error: "Invalid workspace ID" },
        { status: 400 },
      );
    }

    const api = createPecusApiClients();
    const response =
      await api.adminWorkspace.getApiAdminWorkspaces1(workspaceId);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch workspace detail:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
