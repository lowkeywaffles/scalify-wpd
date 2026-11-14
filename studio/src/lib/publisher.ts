import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { composeCaption } from "./captions";
import { decryptSecret } from "./crypto";
import { containerStatus, createContainer, IgError, mediaPermalink, publishContainer } from "./instagram";
import { mediaProblem, type Format } from "./rules";
import { supabaseAdmin } from "./supabase/server";

export const BUCKET = "studio-media";
const MAX_ATTEMPTS = 5;
const PROCESSING_TIMEOUT_MS = 3 * 60 * 60 * 1000;

type Post = {
  id: string; platform: "instagram" | "tiktok"; format: Format; account_id: string | null; caption: string; hashtags: string[];
  asset_ids: string[]; status: string; ig_state: { children?: string[]; container?: string }; attempts: number; started_at: string | null;
};
type Asset = { id: string; path: string; kind: "image" | "video"; mime: string };

export type TickReport = { checked: number; published: number; failed: number; waiting: number; tiktokReady: number; refreshed: number };

async function fail(db: SupabaseClient, id: string, error: string) {
  await db.from("studio_posts").update({ status: "failed", error: error.slice(0, 1000), locked_until: null, updated_at: new Date().toISOString() }).eq("id", id);
}

async function accountToken(db: SupabaseClient, accountId: string): Promise<{ igId: string; token: string } | null> {
  const { data: acc } = await db.from("studio_accounts").select("id, external_id").eq("id", accountId).maybeSingle();
  const { data: sec } = await db.from("studio_secrets").select("token_ciphertext").eq("account_id", accountId).maybeSingle();
  if (!acc || !sec) return null;
  return { igId: acc.external_id, token: decryptSecret(sec.token_ciphertext) };
}

/** Advances one claimed Instagram post by as many steps as are ready right now. Returns the resulting status. */
async function step(db: SupabaseClient, post: Post): Promise<"published" | "failed" | "waiting"> {
  if (!post.account_id) { await fail(db, post.id, "No Instagram account is connected. Connect one under Accounts, then reschedule."); return "failed"; }
  const auth = await accountToken(db, post.account_id);
  if (!auth) { await fail(db, post.id, "The Instagram account was disconnected. Reconnect it under Accounts, then reschedule."); return "failed"; }

  const { data: rows } = await db.from("studio_assets").select("id, path, kind, mime").in("id", post.asset_ids);
  const assets = post.asset_ids.map((id) => (rows ?? []).find((r) => r.id === id)).filter(Boolean) as Asset[];
  if (assets.length !== post.asset_ids.length) { await fail(db, post.id, "One or more media files were deleted from the library."); return "failed"; }
  const problem = mediaProblem("instagram", post.format, assets);
  if (problem) { await fail(db, post.id, problem); return "failed"; }

  const now = new Date();
  const startedAt = post.started_at ? new Date(post.started_at) : now;
  if (now.getTime() - startedAt.getTime() > PROCESSING_TIMEOUT_MS) { await fail(db, post.id, "Instagram took more than 3 hours to process the media. Check the file and try again."); return "failed"; }
  const state = { ...post.ig_state };
  const save = (extra: Record<string, unknown> = {}) =>
    db.from("studio_posts").update({ status: "publishing", ig_state: state, started_at: startedAt.toISOString(), locked_until: null, updated_at: new Date().toISOString(), ...extra }).eq("id", post.id);

  const signed = async (a: Asset) => {
    const { data, error } = await db.storage.from(BUCKET).createSignedUrl(a.path, 3 * 60 * 60);
    if (error || !data) throw new IgError(`Could not create a media link: ${error?.message ?? "unknown"}`, true);
    return data.signedUrl;
  };
  const caption = composeCaption(post.caption, post.hashtags);

  try {
    if (!state.container) {
      if (post.format === "image") state.container = await createContainer(auth.igId, auth.token, { type: "image", url: await signed(assets[0]), caption });
      else if (post.format === "reel") state.container = await createContainer(auth.igId, auth.token, { type: "reel", url: await signed(assets[0]), caption });
      else {
        if (!state.children) {
          const children: string[] = [];
          for (const a of assets) {
            children.push(await createContainer(auth.igId, auth.token, a.kind === "video" ? { type: "video", url: await signed(a), carouselItem: true } : { type: "image", url: await signed(a), carouselItem: true }));
          }
          state.children = children;
          await save();
        }
        for (const c of state.children) {
          const s = await containerStatus(c, auth.token);
          if (s.code === "ERROR" || s.code === "EXPIRED") { await fail(db, post.id, `Instagram could not process carousel item (${s.detail ?? s.code}).`); return "failed"; }
          if (s.code !== "FINISHED") { await save(); return "waiting"; }
        }
        state.container = await createContainer(auth.igId, auth.token, { type: "carousel", children: state.children, caption });
      }
      await save();
    }

    const s = await containerStatus(state.container, auth.token);
    if (s.code === "ERROR" || s.code === "EXPIRED") { await fail(db, post.id, `Instagram could not process the media (${s.detail ?? s.code}).`); return "failed"; }
    if (s.code === "IN_PROGRESS") { await save(); return "waiting"; }
    // FINISHED -> publish. PUBLISHED means an earlier run published but could not record it; never publish twice.
    const mediaId = s.code === "PUBLISHED" ? null : await publishContainer(auth.igId, auth.token, state.container);
    const permalink = mediaId ? await mediaPermalink(mediaId, auth.token) : null;
    await db.from("studio_posts").update({
      status: "published", external_media_id: mediaId, permalink, error: null, published_at: new Date().toISOString(),
      ig_state: state, locked_until: null, updated_at: new Date().toISOString(),
    }).eq("id", post.id);
    return "published";
  } catch (e) {
    const err = e instanceof IgError ? e : new IgError(e instanceof Error ? e.message : "Unknown error", false);
    const attempts = post.attempts + 1;
    if (err.transient && attempts < MAX_ATTEMPTS) {
      await save({ attempts, error: `Retrying (${attempts}/${MAX_ATTEMPTS - 1}): ${err.message}` });
      return "waiting";
    }
    await db.from("studio_posts").update({ attempts }).eq("id", post.id);
    await fail(db, post.id, err.code === 190 ? "Instagram access expired or was revoked. Reconnect the account under Accounts." : err.message);
    return "failed";
  }
}

/** Claims a post for ~2 minutes so overlapping runs (cron + "Publish now") never work on it at the same time. */
async function claim(db: SupabaseClient, id: string): Promise<Post | null> {
  const now = new Date().toISOString();
  const { data } = await db.from("studio_posts")
    .update({ locked_until: new Date(Date.now() + 120_000).toISOString() })
    .eq("id", id).in("status", ["scheduled", "publishing"]).or(`locked_until.is.null,locked_until.lt.${now}`)
    .select("id, platform, format, account_id, caption, hashtags, asset_ids, status, ig_state, attempts, started_at").maybeSingle();
  return (data as Post | null) ?? null;
}

/** One scheduler pass. With postId, only that post (used by "Publish now"). */
export async function tick(opts: { postId?: string } = {}): Promise<TickReport> {
  const db = supabaseAdmin();
  const report: TickReport = { checked: 0, published: 0, failed: 0, waiting: 0, tiktokReady: 0, refreshed: 0 };
  const nowIso = new Date().toISOString();

  if (!opts.postId) {
    // Unified Login system-user tokens from our configuration don't expire, so there is nothing to refresh.
    // TikTok posts are prepared, not auto-posted: when due they move to "ready" and show as a reminder.
    const { data: tt } = await db.from("studio_posts").update({ status: "ready", updated_at: nowIso })
      .eq("platform", "tiktok").eq("status", "scheduled").lte("scheduled_at", nowIso).select("id");
    report.tiktokReady = tt?.length ?? 0;
  }

  let q = db.from("studio_posts").select("id").eq("platform", "instagram").in("status", ["scheduled", "publishing"]);
  q = opts.postId ? q.eq("id", opts.postId) : q.lte("scheduled_at", nowIso);
  const { data: due } = await q.order("scheduled_at", { ascending: true }).limit(10);

  const deadline = Date.now() + 45_000;
  for (const { id } of due ?? []) {
    if (Date.now() > deadline) break;
    const post = await claim(db, id);
    if (!post) continue;
    report.checked++;
    const r = await step(db, post);
    report[r === "published" ? "published" : r === "failed" ? "failed" : "waiting"]++;
  }
  return report;
}
