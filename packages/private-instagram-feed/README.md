# private-instagram-feed

Show your latest Instagram posts on your website **without your visitors' browsers ever contacting Meta**.

Instagram embeds and most feed widgets load Meta's scripts, cookies and CDN in your visitors' browsers. Under GDPR and similar laws, that usually means a consent banner before the feed can appear. This package takes a different route: **your server** fetches your posts with your token and serves the pictures **from your own domain**. Your visitors only ever talk to your site.

- **Zero dependencies.** One small file for the server, one for the browser.
- **Runs anywhere:** Next.js, Vercel and Node functions, Express, Cloudflare Workers, Deno, Bun, Hono.
- **Safe by default:** the token never reaches the browser; only your own current posts can be fetched through the image route (no open proxy); SVG is refused; Meta errors don't leak.
- **Cheap on rate limits:** caches the list in memory and sets CDN cache headers.
- **Accessible drop-in display:** an `<instagram-feed>` element with real links, alt text and lazy loading. It hides itself if the feed is unavailable.

```
npm install private-instagram-feed
```

## 1. Get a token and your account ID

You need an Instagram **professional** account (Business or Creator) and a Meta app of the **Business** type.

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) → your app → **Use cases** → **Instagram API** → **Customize**.
2. New apps get **API setup with Unified login**. Under **Generate access tokens**, add your Instagram account as an Instagram Tester, accept the invite in Instagram (Settings → Website permissions → Apps and websites → Tester invites), then click **Generate token**. The token starts with `EAA…`. Use the default `host: "graph.facebook.com"`.
   - Older apps with **API setup with Instagram login** get a token starting with `IG…`. Use `host: "graph.instagram.com"`; `accountId: "me"` works there.
3. Find your account ID:
   ```
   curl -H "Authorization: Bearer $TOKEN" "https://graph.facebook.com/v27.0/me/assigned_instagram_accounts?fields=id,username"
   ```
4. Store the token as a **secret environment variable** (e.g. `INSTAGRAM_TOKEN`). Never put it in client code.

Check when the token expires: the expiry is shown in the configuration's **Preview** in the Meta dashboard. When it expires, the feed returns `502` and the element hides itself until you add a new token.

## 2. Add the endpoint

```js
import { instagramFeed } from "private-instagram-feed";

const feed = instagramFeed({
  token: process.env.INSTAGRAM_TOKEN,
  accountId: "17841400000000000",
  limit: 6,            // 1–25
  hide: [],            // post IDs to leave out, e.g. one advertising an expired offer
});
```

**Next.js (App Router)**, `app/api/instagram/route.js`:
```js
export const GET = (req) => feed.handle(req);
```

**Vercel / Node function**, `api/instagram.js`:
```js
export default feed.node;
```

**Express:**
```js
app.get("/api/instagram", feed.node);
```

**Cloudflare Workers / Deno / Bun:**
```js
export default { fetch: (req) => feed.handle(req) };
```

`GET /api/instagram` returns:
```json
{ "posts": [{ "id": "1799…", "type": "video", "caption": "…", "permalink": "https://www.instagram.com/reel/…/", "time": "2026-11-22T08:52:13+0000", "image": "/api/instagram?img=1799…" }] }
```
`GET /api/instagram?img=<id>` returns that post's picture (the cover frame for videos).

## 3. Show it

```html
<instagram-feed src="/api/instagram"></instagram-feed>
<script type="module">import "private-instagram-feed/element";</script>
```
(Or copy `element.js` into your site if you don't use a bundler.)

The element renders `<ul class="instagram-feed">` with one link per post and adds no styles, so it matches your site. A starting point:

```css
.instagram-feed { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; list-style: none; padding: 0; }
.instagram-feed a { display: block; aspect-ratio: 3 / 4; border-radius: 12px; overflow: hidden; }
.instagram-feed img { width: 100%; height: 100%; object-fit: cover; display: block; }
```

Rather render it yourself? Call `await feed.posts()` on the server. Each post also has `src`, the Meta image URL. Use it server-side only: putting it in your HTML would make visitors' browsers contact Meta again.

## Privacy notes

- Visitors' browsers contact only your domain. Meta sees requests from your server, not from your visitors.
- Clicking a post goes to Instagram, where Meta's privacy policy applies, the same as any ordinary link.
- Say in your privacy policy that your server fetches your public posts from Meta. This is not legal advice: check the rules that apply to you.
- Add rate limiting at your host or CDN if your platform doesn't already provide it.

## Contributing

Issues and pull requests are welcome: [github.com/lowkeywaffles/scalify-wpd](https://github.com/lowkeywaffles/scalify-wpd/issues). Run the tests with `npm test`.

## License

MIT © SCALIFY WPD. Not affiliated with or endorsed by Meta. Instagram is a trademark of Meta Platforms, Inc.
