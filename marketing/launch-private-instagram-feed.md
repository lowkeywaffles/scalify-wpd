# Launch posts: private-instagram-feed

Post these **after** `npm publish` works (check https://www.npmjs.com/package/private-instagram-feed).
Post from your own accounts, one site a day, and reply to every comment the same day. Read each community's
self-promotion rules first: be open that you made it, and don't ask friends to upvote (that gets posts removed).

Links:
- npm: https://www.npmjs.com/package/private-instagram-feed
- code: https://github.com/lowkeywaffles/scalify-wpd/tree/main/packages/private-instagram-feed
- live example: https://scalify-wpd.vercel.app/#instagram

---

## 1. Hacker News: "Show HN" (news.ycombinator.com/submit)
**Title:** Show HN: Instagram feed for your site without loading anything from Meta
**URL:** the GitHub code link
**First comment (post it yourself right after submitting):**
> I build small-business sites, and clients always want their Instagram on the homepage. Embeds and widgets load Meta's scripts and CDN in every visitor's browser, which in the EU usually means a consent banner before the feed can show.
>
> This is a tiny server-side alternative: your server fetches your posts with your token and serves the pictures from your own domain. Visitors only talk to your site. It's one file with zero dependencies, uses Web-standard Request/Response (Next.js, Workers, Deno, Bun), and has a Node adapter for Express and Vercel. The image route only serves your own current posts, so it can't be used as an open proxy.
>
> Feedback welcome, especially on the token setup. Meta's new "Unified login" flow confused me for a while, so the README walks through it.

## 2. Reddit: r/webdev (Showoff Saturday only: post on a Saturday)
**Title:** [Showoff Saturday] I made a tiny npm package to show an Instagram feed without loading Meta's scripts in visitors' browsers
**Body:**
> Clients keep asking for "our Instagram on the homepage". Embeds pull in Meta's scripts and CDN, which usually means a cookie/consent banner for EU visitors.
>
> private-instagram-feed does it server-side instead: your server fetches the posts, pictures are served from your own domain, and there's an accessible `<instagram-feed>` element to display them. Zero deps, MIT.
>
> It's running on my agency's site: https://scalify-wpd.vercel.app/#instagram
> Code and setup: [GitHub link]. Happy to answer questions about the Meta token setup, which is the painful part.

## 3. Reddit: r/nextjs
**Title:** Instagram feed in a Next.js route handler with no client-side Meta requests (tiny MIT package)
**Body:**
> `app/api/instagram/route.js`:
> ```js
> import { instagramFeed } from "private-instagram-feed";
> const feed = instagramFeed({ token: process.env.INSTAGRAM_TOKEN, accountId: "…" });
> export const GET = (req) => feed.handle(req);
> ```
> Then `<instagram-feed src="/api/instagram">` on the page. The pictures are served by your route, so the browser never hits Meta's CDN. Zero deps, caches the list and sets CDN headers. Feedback welcome: [GitHub link]

## 4. dev.to / Hashnode article
**Title:** How to show your Instagram feed without a cookie banner
**Tags:** #webdev #privacy #javascript #nextjs
**Outline (write it in your own words, ~600 words):**
1. The problem: embeds = Meta scripts + CDN in every visitor's browser → consent needed in the EU (link a source, don't claim legal certainty).
2. The idea: fetch server-side, serve the images from your own domain.
3. Getting a token with Meta's Unified login (screenshots of the dashboard help a lot).
4. 10 lines of code: endpoint + `<instagram-feed>`.
5. Before/after: the browser's Network tab showing no Meta requests.
6. Link to the package. Ask for feedback and contributors.

## 5. X / Threads / LinkedIn (your agency accounts)
> We just open-sourced the Instagram feed from our own website 🧩
> Your latest posts on your site, served from your own domain: no Meta scripts in your visitors' browsers, no extra cookie banner. Zero dependencies, MIT.
> npm i private-instagram-feed
> [GitHub link]

---

## GitHub issues to open (makes it easy for others to contribute)
Label each one `good first issue`:
1. Add an Astro example to the README
2. Add a SvelteKit example to the README
3. Option to include all carousel images, not just the first
4. TypeScript type definitions (`index.d.ts`)
5. Example CSS themes for `<instagram-feed>`
