import { type NextRequest, NextResponse } from "next/server";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const isActive =
      searchParams.get("IsActive") === "true"
        ? true
        : searchParams.get("IsActive") === "false"
          ? false
          : undefined;
    const genreId = searchParams.get("GenreId")
      ? parseInt(searchParams.get("GenreId")!)
      : undefined;
    const name = searchParams.get("Name") || undefined;

    const api = createPecusApiClients();
    const response = await api.adminWorkspace.getApiAdminWorkspaces(
      page,
      isActive,
      genreId,
      name,
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch workspaces:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
