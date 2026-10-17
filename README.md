# Spotify Album Finder

A local Next.js App Router app with TypeScript and Tailwind CSS. Search Spotify albums by artist or album name, narrow by release year, browse pages, and open album details with artwork, release information, and a paginated track list.

## Requirements

- Node.js 20.9+ (Node 24 recommended) and npm.
- A Spotify Developer app and its Client ID/Client Secret.
- Internet access to Spotify and, for installation, the npm registry.

## Start on Windows

Open PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Adi stuff\Code\Spotify album finder'
npm.cmd ci
Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
```

If .env.local already exists, preserve it; do not copy over it. Edit .env.local locally and fill in SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET. SPOTIFY_MARKET defaults to IN; use a two-letter country code such as IN, US, or GB. Never paste the secret into chat or commit it.

```powershell
npm.cmd run dev
```

Open http://127.0.0.1:3000. Restart the server after changing environment values.

## Spotify Developer Dashboard setup

1. Sign in at https://developer.spotify.com/dashboard and create an app named Spotify Album Finder. Add a description, select Web API if asked, and accept Spotify's terms.
2. Spotify's current development-mode rules require the app owner to have an active Spotify Premium subscription. Check Dashboard app status and access limitations before assuming the app can serve a public audience.
3. Open the app's settings and copy its Client ID and Client Secret into .env.local, using the exact variable names from .env.example.
4. This version uses server-to-server Client Credentials. It does not require login scopes, consent, a callback endpoint, or a redirect URI for authentication. If the Dashboard form requires a redirect URI during app creation, use a permitted loopback address such as http://127.0.0.1:3000/callback as a placeholder; this app does not implement that route. Do not use localhost as an OAuth redirect.
5. User login, favorites, and personal listening history are future work and require Authorization Code/PKCE. Development mode currently allows up to five authenticated allowlisted users; that user-login limit is separate from this catalog-only flow.
6. API rate limits and development quotas still apply. Review Spotify's requirements before public deployment, including extended quota eligibility, developer terms, and branding requirements.

Official documentation (checked October 17, 2026):
- Apps: https://developer.spotify.com/documentation/web-api/concepts/apps
- Client Credentials: https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow
- Quota modes and Premium requirement: https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- Redirect URI rules: https://developer.spotify.com/documentation/web-api/concepts/redirect_uri
- Search: https://developer.spotify.com/documentation/web-api/reference/search

## Search examples

- Radiohead
- album:Currents
- artist:"Nina Simone"
- Artist or album text with the optional year 1997 or range 1990-1999.

Search returns up to 10 albums per page, with offsets limited to 1000 under the current Spotify API. Spotify's genre filter applies to artists and tracks, not album searches. Mood recommendations are not implemented. Availability depends on the configured market. Album types include albums, singles, and compilations.

## Commands

- npm.cmd run dev — local development, bound to 127.0.0.1
- npm.cmd run lint — ESLint
- npm.cmd run typecheck — TypeScript
- npm.cmd test — input validation and mocked Spotify authentication/error tests; no real credentials needed
- npm.cmd run build — production build
- npm.cmd start — serve the production build locally

## How it works

- src/lib/spotify.ts is guarded with server-only. It obtains a client-credentials token using a POST to Spotify Accounts, caches the token in process memory with an expiry buffer, shares concurrent token requests, and retries a catalog request once after a 401.
- GET /api/search?q=...&year=...&offset=0 validates input and searches type=album.
- GET /api/albums/:id loads album metadata and its first track page.
- GET /api/albums/:id/tracks?offset=... loads subsequent tracks.
- The browser only receives catalog data and safe errors. Credentials and access tokens are never returned, placed in URLs, or logged.
- Requests have a ten-second upstream timeout. Responses use no-store. Rate-limit responses forward a sanitized Retry-After value.
- .env files are ignored, except the blank .env.example. There are no NEXT_PUBLIC credential variables.
- Album art is displayed unmodified from Spotify's image URLs. Album and track links open Spotify. There is no built-in playback or personal-data access.

A Node-capable server is required; this is not a static export. For a public deployment, configure secrets in the host's environment and add shared abuse/rate limiting to protect the app's Spotify quota. The in-memory token cache is per server process.

## Verification limits

Automated authentication tests mock Spotify. A real token exchange and live catalog search require your own configured Developer app. No real credentials are shipped with this project.

## Local verification completed

On October 17, 2026 (Node 24.16.0, Next.js 16.4.2, React 19.3.1):

- ESLint and TypeScript passed.
- Five automated tests passed, including mocked token acquisition, concurrency, cache expiry, 401 retry, rate limiting, safe error messages, and input validation.
- Production build passed.
- Production dependency audit reported zero vulnerabilities.
- Ten HTTP smoke checks passed for pages, bad inputs, and missing credentials.
- Browser checks passed for the home page, search submission, and missing-credential messages on search and album details.
- Real Spotify authentication/results and narrow-screen browser behavior have not been verified. Responsive styles are implemented.
