import assert from "node:assert/strict";
import { test } from "node:test";
import { instagramFeed } from "../index.js";

const posts = [
  { id: "111", media_type: "VIDEO", caption: "Reel", permalink: "https://www.instagram.com/reel/A/", timestamp: "2026-11-22T08:52:13+0000", thumbnail_url: "https://x.cdninstagram.com/a.jpg" },
  { id: "222", media_type: "IMAGE", permalink: "https://www.instagram.com/p/B/", media_url: "https://x.cdninstagram.com/b.svg" },
  { id: "333", media_type: "IMAGE", permalink: "https://evil.example/", media_url: "https://x.cdninstagram.com/c.jpg" },
  { id: "444", media_type: "IMAGE", permalink: "https://www.instagram.com/p/D/", media_url: "https://evil.example/d.jpg" },
  { id: "555", media_type: "CAROUSEL_ALBUM", permalink: "https://www.instagram.com/p/E/", media_url: "https://x.fbcdn.net/e.jpg" },
];
function fake() {
  const calls = [];
  const f = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("/media?")) return Response.json({ data: posts });
    if (String(url).endsWith(".jpg")) return new Response("jpeg", { headers: { "content-type": "image/jpeg" } });
    if (String(url).endsWith(".svg")) return new Response("<svg/>", { headers: { "content-type": "image/svg+xml" } });
    return new Response("no", { status: 404 });
  };
  return { f, calls };
}
const get = (feed, path) => feed.handle(new Request(`https://site.example${path}`));

test("rejects bad options", () => {
  assert.throws(() => instagramFeed({ accountId: "1" }), /token/);
  assert.throws(() => instagramFeed({ token: "t", accountId: "abc" }), /accountId/);
  assert.throws(() => instagramFeed({ token: "t", accountId: "1", host: "evil.example" }), /host/);
  assert.throws(() => instagramFeed({ token: "t", accountId: "1", limit: 0 }), /limit/);
});

test("lists only safe posts, never exposes Meta URLs or the token, and caches", async () => {
  const { f, calls } = fake();
  const feed = instagramFeed({ token: "SECRET", accountId: "178", hide: ["555"], fetch: f });
  const r = await get(feed, "/api/instagram");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control"), /^public/);
  const body = await r.text();
  assert.ok(!body.includes("cdninstagram") && !body.includes("SECRET"));
  const { posts: out } = JSON.parse(body);
  assert.deepEqual(out.map((p) => p.id), ["111", "222"], "bad permalink, bad CDN host and hidden post dropped");
  assert.equal(out[0].image, "/api/instagram?img=111");
  assert.equal(out[0].type, "video");
  assert.equal(calls[0].init.headers.Authorization, "Bearer SECRET");
  assert.match(calls[0].url, /^https:\/\/graph\.facebook\.com\/v27\.0\/178\/media\?/);
  await get(feed, "/api/instagram");
  assert.equal(calls.filter((c) => c.url.includes("/media?")).length, 1, "list cached");
});

test("serves pictures of current posts only, and refuses svg", async () => {
  const { f } = fake();
  const feed = instagramFeed({ token: "t", accountId: "178", fetch: f });
  let r = await get(feed, "/feed?img=111");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "image/jpeg");
  assert.equal(await r.text(), "jpeg");
  assert.equal((await get(feed, "/feed?img=222")).status, 404, "svg refused");
  assert.equal((await get(feed, "/feed?img=999")).status, 404, "not one of ours");
  assert.equal((await feed.handle(new Request("https://s/feed", { method: "POST" }))).status, 405);
});

test("Instagram errors become a 502 without leaking details", async () => {
  const feed = instagramFeed({ token: "t", accountId: "me", host: "graph.instagram.com", fetch: async () => new Response("{}", { status: 401 }) });
  const r = await get(feed, "/x");
  assert.equal(r.status, 502);
  assert.deepEqual(await r.json(), { error: "Instagram feed unavailable" });
});

test("node adapter writes status, headers and body", async () => {
  const { f } = fake();
  const feed = instagramFeed({ token: "t", accountId: "178", fetch: f });
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
  await feed.node({ method: "GET", url: "/api/ig", headers: { host: "site.example" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(JSON.parse(res.body).posts[0].image, "/api/ig?img=111");
});
