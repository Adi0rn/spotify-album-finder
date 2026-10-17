"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AlbumDetail, Page, Track } from "@/lib/types";
import { Cover } from "./cover";
function duration(ms: number) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
export function AlbumView({ id }: { id: string }) {
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [trackError, setTrackError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/albums/${id}`, { signal: controller.signal }).then(async (r) => {
      const data = await r.json(); if (!r.ok) throw new Error(data.error); return data as AlbumDetail;
    }).then((data) => { setAlbum(data); setTracks(data.tracks.items); setNextOffset(data.tracks.next ? data.tracks.offset + data.tracks.items.length : null); })
      .catch((e) => { if (e.name !== "AbortError") setError(e.message || "Could not load this album."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  async function loadMore() {
    if (nextOffset === null || moreLoading) return;
    setMoreLoading(true); setTrackError("");
    try {
      const r = await fetch(`/api/albums/${id}/tracks?offset=${nextOffset}`);
      const data = await r.json(); if (!r.ok) throw new Error(data.error);
      const page = data as Page<Track>;
      setTracks((previous) => [...previous, ...page.items]);
      setNextOffset(page.next ? page.offset + page.items.length : null);
    } catch (e) { setTrackError(e instanceof Error ? e.message : "Could not load more tracks."); }
    finally { setMoreLoading(false); }
  }
  return <section className="detail"><Link className="back" href="/">← Find more albums</Link>
    {loading && <p className="empty" role="status">Loading the record…</p>}
    {error && <div className="message" role="alert"><h1>Couldn’t load this record.</h1><p>{error}</p><button className="secondary" onClick={() => window.location.reload()}>Try again</button></div>}
    {album && <><div className="album-hero"><Cover album={album} /><div><p className="eyebrow">{album.album_type} · SPOTIFY CATALOG</p><h1>{album.name}</h1><p className="artist">{album.artists.map((a) => a.name).join(", ")}</p><p className="muted">{album.release_date} · {album.total_tracks} tracks{album.label ? ` · ${album.label}` : ""}</p><a className="primary" href={album.external_urls.spotify} target="_blank" rel="noreferrer">Open in Spotify ↗</a></div></div>
      <div className="results-heading"><h2>The track list</h2><span>{tracks.length} of {album.total_tracks} tracks</span></div>
      <ol className="tracks">{tracks.map((track, index) => <li key={`${track.id}-${index}`}><span className="track-number">{track.disc_number}.{track.track_number}</span><div><a href={track.external_urls.spotify} target="_blank" rel="noreferrer">{track.name} ↗</a><p>{track.explicit && <span className="explicit" aria-label="Explicit">E</span>}{track.artists.map((a) => a.name).join(", ")}</p></div><span className="muted">{duration(track.duration_ms)}</span></li>)}</ol>
      {trackError && <p role="alert" className="message">{trackError}</p>}
      {nextOffset !== null && <button className="secondary" disabled={moreLoading} onClick={loadMore}>{moreLoading ? "Loading…" : "Load more tracks"}</button>}
      <div className="copyright">{album.copyrights?.map((c, i) => <p key={i}>{c.text}</p>)}</div>
    </>}
  </section>;
}
