"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Album, Page } from "@/lib/types";
import { Cover } from "./cover";

export function Finder() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const year = params.get("year") ?? "";
  const offset = params.get("offset") ?? "0";
  return <section aria-label="Album search">
    <form className="search-panel" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      router.push(`/?${new URLSearchParams({ q: String(form.get("q") ?? "").trim(), year: String(form.get("year") ?? "").trim() })}`);
    }}>
      <div className="search-field"><label htmlFor="query">ALBUM OR ARTIST</label><input key={q} id="query" name="q" defaultValue={q} placeholder="What do you want to discover?" maxLength={200} required /></div>
      <div className="year-field"><label htmlFor="year">RELEASE YEAR <span>OPTIONAL</span></label><input key={year} id="year" name="year" defaultValue={year} placeholder="e.g. 1990–1999" pattern="[0-9]{4}(-[0-9]{4})?" title="Use a year or a range, such as 1990-1999" /></div>
      <button className="primary" type="submit">Find albums <span aria-hidden="true">↗</span></button>
    </form>
    <p className="hint">A good place to start: <Link href="/?q=Radiohead">Radiohead</Link><Link href="/?q=album%3ACurrents">Currents</Link><Link href="/?q=artist%3ANina%20Simone">Nina Simone</Link></p>
    <Results key={JSON.stringify([q, year, offset])} q={q} year={year} offset={offset} />
  </section>;
}

function Results({ q, year, offset }: { q: string; year: string; offset: string }) {
  const [result, setResult] = useState<Page<Album> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(q));
  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    fetch(`/api/search?${new URLSearchParams({ q, year, offset })}`, { signal: controller.signal })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then(setResult)
      .catch((error) => { if (error.name !== "AbortError") setError(error.message || "Search failed. Please try again."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [q, year, offset]);
  const href = (nextOffset: number) => `/?${new URLSearchParams({ q, year, offset: String(nextOffset) })}`;
  return <div aria-live="polite" aria-busy={loading}>
    {loading && <div className="empty" role="status"><span className="record spinning" aria-hidden="true">◉</span><h2>Digging through the crates…</h2></div>}
    {error && <div className="message" role="alert"><h2>We couldn’t load the albums.</h2><p>{error}</p><button onClick={() => window.location.reload()} className="secondary">Try again</button></div>}
    {!loading && !error && !q && <div className="empty"><span className="record" aria-hidden="true">◉</span><p className="eyebrow">SO MANY RECORDS. WHERE TO BEGIN?</p><h2>Follow your curiosity.</h2><p>Search for an old favorite or a name you’ve been meaning to hear.<br />Your next album is waiting.</p></div>}
    {!loading && !error && result && <>
      <div className="results-heading"><h2>Records for “{q}”</h2><span>{result.total.toLocaleString()} results · via Spotify</span></div>
      {result.items.length === 0 ? <div className="empty"><h2>No records found.</h2><p>Try another album or artist, or broaden the release year.</p></div> : <div className="album-grid">{result.items.map((album) => <article key={album.id} className="album-card"><Link href={`/albums/${album.id}`}><Cover album={album} /><h3>{album.name}</h3></Link><p>{album.artists.map((a) => a.name).join(", ")}</p><div className="card-meta"><span>{album.release_date.slice(0, 4)} · {album.album_type} · {album.total_tracks} tracks</span><a href={album.external_urls.spotify} target="_blank" rel="noreferrer" aria-label={`Open ${album.name} on Spotify`}>Spotify ↗</a></div></article>)}</div>}
      <nav className="pagination" aria-label="Search pages">{Number(offset) > 0 && <Link className="secondary" href={href(Math.max(0, Number(offset) - 10))}>← Previous</Link>}<span>Page {Math.floor(Number(offset) / 10) + 1}</span>{result.next && Number(offset) + 10 <= 1000 && <Link className="secondary" href={href(Number(offset) + 10)}>Next →</Link>}</nav>
    </>}
  </div>;
}
