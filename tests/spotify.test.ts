import test from "node:test";
import assert from "node:assert/strict";
import { searchAlbums, getAlbum, SpotifyError } from "../src/lib/spotify";

test("server Spotify client handles credentials, concurrency, expiry, retry and safe errors", async (t) => {
  const oldId = process.env.SPOTIFY_CLIENT_ID;
  const oldSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const oldMarket = process.env.SPOTIFY_MARKET;
  const restoreEnv = () => {
    for (const [key, value] of Object.entries({SPOTIFY_CLIENT_ID: oldId, SPOTIFY_CLIENT_SECRET: oldSecret, SPOTIFY_MARKET: oldMarket})) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  };
  let time = 100000;
  t.mock.method(Date, "now", () => time);
  const calls: {url: string; init: RequestInit}[] = [];
  let mode = "ok";
  let tokenCount = 0;
  let failOnce = false;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push({url, init});
    if (url === "https://accounts.spotify.com/api/token") {
      tokenCount++;
      if (mode === "auth") return Response.json({error:"test-secret"}, {status:400});
      return Response.json({access_token:`test-token-${tokenCount}`, expires_in:3600});
    }
    if (mode === "network") throw new Error("test-secret");
    if (mode === "rate") return Response.json({error:"test-secret"}, {status:429,headers:{"Retry-After":"12"}});
    if (mode === "forbidden") return Response.json({}, {status:403});
    if (mode === "missing") return Response.json({}, {status:404});
    if (mode === "unauthorized" && !failOnce) { failOnce = true; return Response.json({}, {status:401}); }
    return Response.json({albums:{items:[],total:0,offset:0,limit:10,next:null}});
  });
  try {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
    await assert.rejects(searchAlbums("Radiohead",0), (e: unknown) => e instanceof SpotifyError && e.status === 503);
    assert.equal(calls.length,0);
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    process.env.SPOTIFY_MARKET = "IN";
    await Promise.all([searchAlbums("Radiohead",0),searchAlbums("Currents",10)]);
    assert.equal(tokenCount,1, "concurrent callers share token acquisition");
    const auth = calls.find((c) => c.url.includes("/api/token"))!;
    assert.equal(new Headers(auth.init.headers).get("Authorization"), `Basic ${Buffer.from("test-id:test-secret").toString("base64")}`);
    assert.equal(String(auth.init.body),"grant_type=client_credentials");
    const api = calls.find((c) => c.url.includes("/v1/search"))!;
    const url = new URL(api.url);
    assert.equal(url.searchParams.get("market"),"IN");
    assert.equal(url.searchParams.get("limit"),"10");
    assert.equal(url.searchParams.get("type"),"album");
    assert.equal(url.searchParams.has("client_secret"),false);
    assert.equal(api.init.cache,"no-store");
    await searchAlbums("cached",0);
    assert.equal(tokenCount,1);
    time += 3600000;
    await searchAlbums("expired",0);
    assert.equal(tokenCount,2);
    mode = "unauthorized";
    await searchAlbums("retry",0);
    assert.equal(tokenCount,3,"401 causes one new token");
    mode = "rate";
    await assert.rejects(searchAlbums("rate",0), (e: unknown) => e instanceof SpotifyError && e.status === 429 && e.retryAfter === "12" && !e.message.includes("test-secret"));
    mode = "forbidden";
    await assert.rejects(searchAlbums("denied",0), (e: unknown) => e instanceof SpotifyError && e.status === 403);
    mode = "missing";
    await assert.rejects(getAlbum("4aawyAB9vmqN3uQ7FjRGTy"), (e: unknown) => e instanceof SpotifyError && e.status === 404);
    mode = "network";
    await assert.rejects(searchAlbums("offline",0), (e: unknown) => e instanceof SpotifyError && !e.message.includes("test-secret"));
    mode = "auth"; time += 3600000;
    await assert.rejects(searchAlbums("bad credentials",0), (e: unknown) => e instanceof SpotifyError && e.status === 503 && !e.message.includes("test-secret"));
    mode = "ok";
    await searchAlbums("recover",0);
    assert.equal(tokenCount,5,"failed token promise is cleared so a later call recovers");
  } finally { restoreEnv(); t.mock.restoreAll(); }
});
