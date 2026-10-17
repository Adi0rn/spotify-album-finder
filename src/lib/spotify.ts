import "server-only";
import type { Album, AlbumDetail, Page, Track } from "./types";

export class SpotifyError extends Error {
  constructor(message: string, public status = 502, public retryAfter?: string) { super(message); }
}
let cached: { token: string; expiresAt: number } | undefined;
let pending: Promise<string> | undefined;

async function request(url: string, init: RequestInit) {
  try { return await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(10000) }); }
  catch { throw new SpotifyError("Spotify could not be reached. Please try again."); }
}
function failure(response: Response, auth = false): never {
  if (response.status === 429) {
    const value = response.headers.get("retry-after");
    throw new SpotifyError("Spotify is receiving too many requests. Please try again later.", 429, value && /^\d+$/.test(value) ? value : "30");
  }
  if (auth) throw new SpotifyError("Spotify authentication failed. Check the server credentials.", 503);
  if (response.status === 404) throw new SpotifyError("This album could not be found.", 404);
  if (response.status === 403) throw new SpotifyError("Spotify denied access. Check the app's Dashboard access and Premium requirements.", 403);
  throw new SpotifyError("Spotify could not complete this request. Please try again.", 502);
}
async function createToken() {
  const id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new SpotifyError("Spotify is not configured yet. Add credentials to .env.local and restart the app.", 503);
  const response = await request("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!response.ok) failure(response, true);
  const data = await response.json();
  if (typeof data.access_token !== "string" || typeof data.expires_in !== "number") throw new SpotifyError("Spotify returned an invalid authentication response.");
  cached = { token: data.access_token, expiresAt: Date.now() + Math.max(0, data.expires_in - 60) * 1000 };
  return cached.token;
}
async function accessToken() {
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  if (!pending) pending = createToken().finally(() => { pending = undefined; });
  return pending;
}
async function get<T>(path: string, params = new URLSearchParams()): Promise<T> {
  const market = (process.env.SPOTIFY_MARKET ?? "IN").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(market)) throw new SpotifyError("Set SPOTIFY_MARKET to a two-letter country code.", 503);
  params.set("market", market);
  const url = `https://api.spotify.com/v1/${path}?${params}`;
  let token = await accessToken();
  let response = await request(url, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401) {
    if (cached?.token === token) cached = undefined;
    token = await accessToken();
    response = await request(url, { headers: { Authorization: `Bearer ${token}` } });
  }
  if (!response.ok) failure(response);
  return response.json() as Promise<T>;
}
export async function searchAlbums(query: string, offset: number) {
  const result = await get<{ albums: Page<Album> }>("search", new URLSearchParams({ q: query, type: "album", limit: "10", offset: String(offset) }));
  return result.albums;
}
export function getAlbum(id: string) { return get<AlbumDetail>(`albums/${id}`); }
export function getTracks(id: string, offset: number) {
  return get<Page<Track>>(`albums/${id}/tracks`, new URLSearchParams({ limit: "50", offset: String(offset) }));
}
