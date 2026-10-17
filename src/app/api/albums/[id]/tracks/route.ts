import { NextRequest, NextResponse } from "next/server";
import { InputError, validAlbumId, trackOffset } from "@/lib/query";
import { getTracks } from "@/lib/spotify";
import { apiError } from "@/lib/api-error";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!validAlbumId(id)) throw new InputError("Invalid album ID.");
    return NextResponse.json(await getTracks(id, trackOffset(request.nextUrl.searchParams)), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
