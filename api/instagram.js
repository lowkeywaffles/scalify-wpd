// GET /api/instagram          — our own latest Instagram posts, for the homepage.
// GET /api/instagram?img=<id> — that post's picture, served from this site so visitors' browsers never contact Meta.
// Uses our open-source package private-instagram-feed. Needs INSTAGRAM_TOKEN; without it the homepage section stays hidden.
import { instagramFeed } from "private-instagram-feed";
import { ConfigError, handler, ipOf, rateLimit, send } from "./_lib/http.js";

let feed;
const getFeed = () => {
  if (!process.env.INSTAGRAM_TOKEN) throw new ConfigError("INSTAGRAM_TOKEN");
  return (feed ??= instagramFeed({
    token: process.env.INSTAGRAM_TOKEN,
    accountId: "17841454007613579", // @scalifywpd (public, not a secret)
    hide: ["18181438912435598", "18119767756995083", "18371947531247952", "17953821189085632"], // FIRST6 50% off, ended 18 Nov 2026
  }));
};

export default handler(["GET"], async (req, res) => {
  if (!rateLimit(`ig:${ipOf(req)}`, 60, 60_000)) return send(res, 429, { error: "Too many requests" });
  return getFeed().node(req, res);
});
