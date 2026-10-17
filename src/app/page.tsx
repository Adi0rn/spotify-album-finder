import { Suspense } from "react";
import { Finder } from "@/components/finder";
export default function Home() {
  return <><section className="hero"><p className="eyebrow">YOUR NEXT GREAT LISTEN</p><h1>Find a record.<br /><span>Fall into something new.</span></h1><p className="intro">The album you came for. The artist you didn’t know you needed.<br />Start exploring the Spotify catalog, one record at a time.</p></section><Suspense fallback={<p role="status">Loading search…</p>}><Finder /></Suspense></>;
}
