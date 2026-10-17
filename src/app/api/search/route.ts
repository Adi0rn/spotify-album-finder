import { NextRequest, NextResponse } from "next/server";
import { searchInput } from "@/lib/query";
import { searchAlbums } from "@/lib/spotify";
import { apiError } from "@/lib/api-error";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const { query, offset } = searchInput(request.nextUrl.searchParams);
    return NextResponse.json(await searchAlbums(query, offset), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
