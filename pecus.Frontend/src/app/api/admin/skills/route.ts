import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const isActiveParam = searchParams.get("IsActive");
    const isActive =
      isActiveParam === "true"
        ? true
        : isActiveParam === "false"
          ? false
          : undefined;
    const unusedOnlyParam = searchParams.get("UnusedOnly");
    const unusedOnly = unusedOnlyParam === "true" ? true : undefined;
    const name = searchParams.get("Name") || undefined;

    console.log("API Route /api/admin/skills - Query params:", {
      page,
      isActiveParam,
      isActive,
      unusedOnlyParam,
      unusedOnly,
      name,
    });

    const api = createPecusApiClients();

    console.log("Calling adminSkill.getApiAdminSkills with:", {
      page,
      isActive,
      unusedOnly,
      name,
    });

    const response = await api.adminSkill.getApiAdminSkills(
      page,
      isActive,
      unusedOnly,
      name,
    );

    console.log("Skills response received:", {
      dataLength: response.data?.length ?? 0,
      currentPage: response.currentPage,
      totalPages: response.totalPages,
      hasData: !!response.data,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("API Route /api/admin/skills - Error:", {
      message: error?.message,
      statusCode: error?.status,
      body: error?.body,
      stack: error?.stack,
    });

    // エラーレスポンスをより詳細に返す
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: {
          message: error?.message,
          statusCode: error?.status,
          apiErrorMessage: error?.body?.message,
        },
      },
      { status: 500 },
    );
  }
}
