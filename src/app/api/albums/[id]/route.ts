import { NextResponse } from "next/server";
import { InputError, validAlbumId } from "@/lib/query";
import { getAlbum } from "@/lib/spotify";
import { apiError } from "@/lib/api-error";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!validAlbumId(id)) throw new InputError("Invalid album ID.");
    return NextResponse.json(await getAlbum(id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
