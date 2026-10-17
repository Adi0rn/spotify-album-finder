import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = { title: "Album Finder · Discover your next record", description: "Find albums and explore their tracks using the Spotify catalog." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="shell">
    <header><Link href="/" className="brand"><span className="brand-icon" aria-hidden="true">◉</span> album finder<span className="brand-dot">.</span></Link><span className="header-note">A little curiosity. A whole new record.</span></header>
    <main>{children}</main><footer><span>Made for the love of the album.</span><a href="https://open.spotify.com" target="_blank" rel="noreferrer">Catalog from Spotify ↗</a></footer>
  </div></body></html>;
}
