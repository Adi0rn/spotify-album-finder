import test from "node:test";
import assert from "node:assert/strict";
import { InputError, searchInput, validAlbumId, trackOffset } from "../src/lib/query";
test("search preserves Spotify syntax and safely combines a year range", () => {
  assert.deepEqual(searchInput(new URLSearchParams({q:'artist:Radiohead',year:'1990-1999',offset:'10'})), {query:'artist:Radiohead year:1990-1999',offset:10});
});
test("invalid or abusive search values are rejected before upstream requests", () => {
  const invalid: Record<string, string>[] = [{q:" "},{q:"x".repeat(201)},{q:"ok",offset:"-1"},{q:"ok",offset:"1001"},{q:"ok",offset:"NaN"},{q:"ok",year:"1999-1990"},{q:"ok",year:"90s"}];
  for (const params of invalid) {
    assert.throws(() => searchInput(new URLSearchParams(params)), InputError);
  }
});
test("album IDs cannot inject Spotify URL paths", () => {
  assert.equal(validAlbumId("4aawyAB9vmqN3uQ7FjRGTy"),true);
  for (const value of ["../me", "", "a".repeat(23), "https://example.com"]) assert.equal(validAlbumId(value),false);
});
test("track offsets must be bounded nonnegative integers", () => {
  assert.equal(trackOffset(new URLSearchParams("offset=50")),50);
  for (const value of ["-1","1.2","Infinity","10001"]) assert.throws(() => trackOffset(new URLSearchParams({offset:value})),InputError);
});
