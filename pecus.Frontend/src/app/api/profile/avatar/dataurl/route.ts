import { NextRequest, NextResponse } from "next/server";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/avatar/dataurl
 * ログインユーザーのアバター画像をDataURL形式で取得
 */
export async function GET(request: NextRequest) {
  try {
    const clients = await createPecusApiClients();
    const result = await clients.profile.getApiProfileAvatarDataurl();

    return NextResponse.json(
      { dataUrl: result.dataUrl },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.status === 404) {
      return NextResponse.json(
        { message: "アバター画像が設定されていません" },
        { status: 404 }
      );
    }

    console.error("Avatar DataURL fetch error:", error);
    return NextResponse.json(
      { message: "アバター画像の取得に失敗しました" },
      { status: 500 }
    );
  }
}
