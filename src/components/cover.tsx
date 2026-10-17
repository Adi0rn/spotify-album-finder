/* eslint-disable @next/next/no-img-element */
import type { Album } from "@/lib/types";
export function Cover({ album }: { album: Album }) {
  return album.images[0] ? <img className="cover" src={album.images[0].url} alt={`${album.name} album cover`} loading="lazy" /> : <div className="cover no-cover" role="img" aria-label="No album artwork">♪</div>;
}
