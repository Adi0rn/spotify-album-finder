export type Artist = { id: string; name: string };
export type Album = {
  id: string; name: string; album_type: string; artists: Artist[];
  images: { url: string; width: number; height: number }[];
  release_date: string; total_tracks: number;
  external_urls: { spotify: string };
};
export type Track = {
  id: string; name: string; artists: Artist[]; duration_ms: number;
  disc_number: number; track_number: number; explicit: boolean;
  external_urls: { spotify: string };
};
export type Page<T> = { items: T[]; total: number; offset: number; limit: number; next: string | null };
export type AlbumDetail = Album & { label?: string; copyrights?: { text: string }[]; tracks: Page<Track> };
