// private-instagram-feed: show your latest Instagram posts on your site without your visitors' browsers ever contacting Meta.
// Your server fetches the posts with your token and serves the pictures from your own domain. Zero dependencies.

const CDN = /^https:\/\/[a-z0-9.-]+\.(cdninstagram\.com|fbcdn\.net)\//;
const IMAGE = /^image\/(jpeg|png|webp|gif)$/; // never svg: it can carry script
const HOSTS = ["graph.facebook.com", "graph.instagram.com"];
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

const json = (status, body, cache = "no-store") =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cache, "X-Content-Type-Options": "nosniff" } });

/**
 * @param {object} o
 * @param {string} o.token        Instagram access token. Keep it server-side (an environment variable).
 * @param {string} o.accountId    Instagram professional account ID (or "me" with an Instagram Login token on graph.instagram.com).
 * @param {"graph.facebook.com"|"graph.instagram.com"} [o.host]  Unified/Facebook Login tokens (EAA…): graph.facebook.com (default). Instagram Login tokens (IG…): graph.instagram.com.
 * @param {number} [o.limit=6]    Posts to return, 1–25.
 * @param {string[]} [o.hide=[]]  Post IDs never to show (e.g. an expired offer).
 * @param {number} [o.cacheSeconds=600]  How long each server instance reuses the list (keeps you far below Meta's rate limits).
 * @param {string} [o.apiVersion="v27.0"]
 * @param {typeof fetch} [o.fetch]  For tests or custom agents.
 */
export function instagramFeed(o = {}) {
  const { token, accountId, host = HOSTS[0], limit = 6, hide = [], cacheSeconds = 600, apiVersion = "v27.0", fetch: f = globalThis.fetch } = o;
  if (typeof token !== "string" || !token) throw new TypeError("instagramFeed: `token` is required (keep it in an environment variable)");
  if (accountId !== "me" && !/^\d{1,30}$/.test(String(accountId ?? ""))) throw new TypeError("instagramFeed: `accountId` must be a numeric Instagram account ID or \"me\"");
  if (!HOSTS.includes(host)) throw new TypeError(`instagramFeed: \`host\` must be one of ${HOSTS.join(", ")}`);
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new TypeError("instagramFeed: `limit` must be 1–25");
  if (!/^v\d+\.\d+$/.test(apiVersion)) throw new TypeError("instagramFeed: `apiVersion` looks like v27.0");
  const hidden = new Set(hide.map(String));
  const api = `https://${host}/${apiVersion}/${accountId}/media?fields=${FIELDS}&limit=${Math.min(50, limit + hidden.size)}`;
  let cache = { at: 0, posts: null };

  /** Latest posts with the Meta image URL (`src`). Server-side only: never send `src` to browsers. */
  async function posts() {
    if (cache.posts && Date.now() - cache.at < cacheSeconds * 1000) return cache.posts;
    const r = await f(api, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`Instagram API ${r.status}${r.status === 400 || r.status === 401 ? " (token expired or wrong host?)" : ""}`);
    const list = ((await r.json()).data || [])
      .map((p) => ({
        id: String(p.id),
        type: p.media_type === "VIDEO" ? "video" : p.media_type === "CAROUSEL_ALBUM" ? "carousel" : "image",
        caption: String(p.caption || ""),
        permalink: String(p.permalink || ""),
        time: String(p.timestamp || ""),
        src: p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url,
      }))
      .filter((p) => !hidden.has(p.id) && /^\d{1,30}$/.test(p.id) && p.permalink.startsWith("https://www.instagram.com/") && CDN.test(String(p.src)))
      .slice(0, limit);
    cache = { at: Date.now(), posts: list };
    return list;
  }

  /**
   * Web-standard handler: `GET <path>` → JSON list, `GET <path>?img=<id>` → that post's picture.
   * Works as-is in Next.js route handlers, Cloudflare Workers, Deno, Bun and Hono.
   */
  async function handle(request) {
    if (request.method !== "GET" && request.method !== "HEAD") return json(405, { error: "Method not allowed" });
    const url = new URL(request.url);
    let list;
    try { list = await posts(); } catch (e) { console.error(`[private-instagram-feed] ${e.message}`); return json(502, { error: "Instagram feed unavailable" }); }
    const img = url.searchParams.get("img");
    if (img === null) {
      return json(200, { posts: list.map(({ src, ...p }) => ({ ...p, image: `${url.pathname}?img=${p.id}` })) }, "public, s-maxage=900, stale-while-revalidate=86400");
    }
    const p = list.find((x) => x.id === img); // only your current posts, so this can't be used to fetch anything else
    if (!p) return json(404, { error: "Not found" });
    const r = await f(p.src, { signal: AbortSignal.timeout(8000) }).catch(() => null);
    const type = (r?.headers.get("content-type") || "").split(";")[0].trim();
    if (!r?.ok || !IMAGE.test(type)) return json(404, { error: "Not found" });
    return new Response(request.method === "HEAD" ? null : await r.arrayBuffer(), { status: 200, headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600, s-maxage=86400", "X-Content-Type-Options": "nosniff" } });
  }

  /** Node.js / Express / Vercel functions: `(req, res) => …` */
  async function node(req, res) {
    const proto = req.headers["x-forwarded-proto"] || "http";
    const out = await handle(new Request(new URL(req.originalUrl || req.url, `${proto}://${req.headers.host || "localhost"}`), { method: req.method }));
    res.statusCode = out.status;
    out.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await out.arrayBuffer()));
  }

  return { posts, handle, node };
}
