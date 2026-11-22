// GET /api/instagram          — our own latest Instagram posts, for the homepage.
// GET /api/instagram?img=<id> — that post's picture, served from this site so visitors' browsers never contact Meta.
// Needs INSTAGRAM_TOKEN (the Unified-login token for @scalifywpd). Without it the homepage section stays hidden.
import { ConfigError, fetchT, handler, ipOf, rateLimit, send } from "./_lib/http.js";

const ACCOUNT = "17841454007613579"; // @scalifywpd's Instagram account ID (public, not a secret)
const API = `https://graph.facebook.com/v27.0/${ACCOUNT}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=6`;
const CDN = /^https:\/\/[a-z0-9.-]+\.(cdninstagram\.com|fbcdn\.net)\//;
const IMAGE = /^image\/(jpeg|png|webp|gif)$/; // never svg: it can carry script
let cache = { at: 0, posts: null };

async function latest() {
  if (cache.posts && Date.now() - cache.at < 10 * 60_000) return cache.posts; // also keeps us far below Meta's rate limit
  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) throw new ConfigError("INSTAGRAM_TOKEN");
  const r = await fetchT(API, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`instagram ${r.status}`); // 400/401 usually means the token expired: make a new one
  const posts = ((await r.json()).data || [])
    .map((p) => ({
      id: String(p.id),
      type: p.media_type === "VIDEO" ? "video" : "image",
      caption: String(p.caption || "").split("\n")[0].trim().slice(0, 120),
      permalink: String(p.permalink || ""),
      time: String(p.timestamp || ""),
      src: p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url,
    }))
    .filter((p) => /^\d{1,30}$/.test(p.id) && p.permalink.startsWith("https://www.instagram.com/") && CDN.test(String(p.src)));
  cache = { at: Date.now(), posts };
  return posts;
}

export default handler(["GET"], async (req, res) => {
  if (!rateLimit(`ig:${ipOf(req)}`, 60, 60_000)) return send(res, 429, { error: "Too many requests" });
  const posts = await latest();
  if (req.query.img === undefined) {
    return send(res, 200, { posts: posts.map(({ src, ...p }) => ({ ...p, image: `/api/instagram?img=${p.id}` })) },
      { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400" });
  }
  const p = posts.find((x) => x.id === req.query.img); // only our current posts, so this can't fetch anything else
  if (!p) return send(res, 404, { error: "Not found" });
  const r = await fetchT(p.src);
  const type = (r.headers.get("content-type") || "").split(";")[0].trim();
  if (!r.ok || !IMAGE.test(type)) return send(res, 404, { error: "Not found" });
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.statusCode = 200;
  res.end(Buffer.from(await r.arrayBuffer()));
});
