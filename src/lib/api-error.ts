import { NextResponse } from "next/server";
import { InputError } from "./query";
import { SpotifyError } from "./spotify";
export function apiError(error: unknown) {
  const status = error instanceof InputError ? 400 : error instanceof SpotifyError ? error.status : 500;
  const message = error instanceof InputError || error instanceof SpotifyError ? error.message : "Something went wrong. Please try again.";
  return NextResponse.json({ error: message }, { status, headers: {
    "Cache-Control": "no-store",
    ...(error instanceof SpotifyError && error.retryAfter ? { "Retry-After": error.retryAfter } : {}),
  } });
}
