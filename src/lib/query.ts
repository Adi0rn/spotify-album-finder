export class InputError extends Error {}
export function searchInput(params: URLSearchParams) {
  const q = (params.get("q") ?? "").trim();
  const year = (params.get("year") ?? "").trim();
  const rawOffset = params.get("offset") ?? "0";
  if (!q || q.length > 200) throw new InputError("Enter an album or artist (1–200 characters).");
  if (year && !/^\d{4}(-\d{4})?$/.test(year)) throw new InputError("Use a four-digit year or a range, such as 1990-1999.");
  if (year.includes("-") && year.slice(0, 4) > year.slice(5)) throw new InputError("The first year must come before the last year.");
  if (!/^\d+$/.test(rawOffset) || Number(rawOffset) > 1000) throw new InputError("Search offset must be between 0 and 1000.");
  return { query: year ? `${q} year:${year}` : q, offset: Number(rawOffset) };
}
export function validAlbumId(id: string) { return /^[A-Za-z0-9]{22}$/.test(id); }
export function trackOffset(params: URLSearchParams) {
  const value = params.get("offset") ?? "0";
  if (!/^\d+$/.test(value) || Number(value) > 10000) throw new InputError("Invalid track offset.");
  return Number(value);
}
