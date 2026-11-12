"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { draftCaptions, type DraftResult } from "@/lib/ai";
import { checkCaption, normalizeHashtags, type Platform } from "@/lib/captions";
import { requireMember, requireOwner } from "@/lib/members";
import { BUCKET, tick } from "@/lib/publisher";
import { allow } from "@/lib/rate-limit";
import { mediaProblem, type Format } from "@/lib/rules";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { AUDIENCES, GOALS, TONES } from "@/lib/templates";

export type Result = { ok: boolean; error?: string; message?: string };
const Id = z.string().uuid();
const MAX_BYTES = 50 * 1024 * 1024;
const MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "video/mp4": "mp4", "video/quicktime": "mov" };

/* ---------- Library ---------- */

export async function createUpload(input: { mime: string; size: number }): Promise<{ ok: true; path: string; token: string } | { ok: false; error: string }> {
  const me = await requireMember();
  if (!allow(`up:${me.email}`, 60, 60 * 60_000)) return { ok: false, error: "Upload limit reached for this hour." };
  const ext = MIME_EXT[input.mime];
  if (!ext) return { ok: false, error: "Use JPEG or PNG images, or MP4/MOV videos. (Instagram needs JPEG for photos.)" };
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_BYTES) return { ok: false, error: "Files must be 50 MB or smaller (Supabase free plan limit)." };
  const path = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Could not start the upload. Try again." };
  return { ok: true, path: data.path, token: data.token };
}

export async function registerAsset(input: { path: string; mime: string; label: string }): Promise<Result> {
  const me = await requireMember();
  const path = z.string().regex(/^\d{4}-\d{2}\/[0-9a-f-]{36}\.(jpg|png|mp4|mov)$/).safeParse(input.path);
  const ext = MIME_EXT[input.mime];
  if (!path.success || !ext || !path.data.endsWith(`.${ext}`)) return { ok: false, error: "Invalid upload." };
  const [dir, name] = path.data.split("/");
  const admin = supabaseAdmin();
  const { data: files } = await admin.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
  const file = files?.find((f) => f.name === name);
  if (!file) return { ok: false, error: "The upload didn't finish. Try again." };
  const size = Number((file.metadata as { size?: number } | null)?.size ?? 0);
  const realMime = String((file.metadata as { mimetype?: string } | null)?.mimetype ?? input.mime);
  if (realMime !== input.mime || size <= 0 || size > MAX_BYTES) {
    await admin.storage.from(BUCKET).remove([path.data]);
    return { ok: false, error: "The file type or size didn't match. Upload removed." };
  }
  const db = await supabaseServer();
  const { error } = await db.from("studio_assets").insert({
    path: path.data, kind: input.mime.startsWith("video/") ? "video" : "image", mime: input.mime, size_bytes: size,
    label: input.label.trim().slice(0, 120) || null, created_by: me.email,
  });
  if (error) { console.error("[studio] registerAsset", error.message); return { ok: false, error: "Could not save the file to the library." }; }
  revalidatePath("/studio/library");
  return { ok: true };
}

export async function deleteAsset(id: string): Promise<Result> {
  await requireMember();
  if (!Id.safeParse(id).success) return { ok: false, error: "Invalid file." };
  const db = await supabaseServer();
  const { data: inUse } = await db.from("studio_posts").select("id").contains("asset_ids", [id]).in("status", ["scheduled", "publishing", "ready"]).limit(1);
  if (inUse?.length) return { ok: false, error: "This file is used by a scheduled post. Cancel or change that post first." };
  const { data: asset } = await db.from("studio_assets").select("path").eq("id", id).maybeSingle();
  if (!asset) return { ok: false, error: "File not found." };
  await supabaseAdmin().storage.from(BUCKET).remove([asset.path]);
  await db.from("studio_assets").delete().eq("id", id);
  revalidatePath("/studio/library");
  return { ok: true };
}

/* ---------- Assistant ---------- */

const DraftInput = z.object({
  brief: z.string().max(1500),
  goal: z.enum(Object.keys(GOALS) as [keyof typeof GOALS]),
  tone: z.enum(Object.keys(TONES) as [keyof typeof TONES]),
  platform: z.enum(["instagram", "tiktok"]),
  audiences: z.array(z.enum(Object.keys(AUDIENCES) as [keyof typeof AUDIENCES])).max(7),
  language: z.enum(["English", "Amharic", "Arabic", "French", "Spanish"]),
});

export async function draftAction(input: z.infer<typeof DraftInput>): Promise<DraftResult | { error: string }> {
  const me = await requireMember();
  const parsed = DraftInput.safeParse(input);
  if (!parsed.success) return { error: "Check the assistant options." };
  if (!allow(`ai:${me.email}`, 20, 60 * 60_000)) return { error: "Assistant limit reached for this hour (protects the free Gemini quota)." };
  return draftCaptions(parsed.data);
}

/* ---------- Posts ---------- */

const PostInput = z.object({
  id: z.string().uuid().optional(),
  targets: z.array(z.object({ platform: z.enum(["instagram", "tiktok"]), format: z.enum(["image", "carousel", "reel", "video", "photos"]) })).min(1).max(2),
  caption: z.string().max(2200),
  hashtags: z.string().max(1000),
  assetIds: z.array(z.string().uuid()).min(1, "Pick at least one media file.").max(10),
  scheduledAt: z.string().datetime({ offset: true }).nullable(),
  mode: z.enum(["draft", "schedule", "now"]),
});

export async function savePost(input: z.infer<typeof PostInput>): Promise<Result & { ids?: string[] }> {
  const me = await requireMember();
  const parsed = PostInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const p = parsed.data;
  if (new Set(p.targets.map((t) => t.platform)).size !== p.targets.length) return { ok: false, error: "Choose each platform once." };
  if (p.id && p.targets.length !== 1) return { ok: false, error: "An existing post belongs to one platform." };
  const hashtags = normalizeHashtags(p.hashtags);
  const db = await supabaseServer();

  const { data: rows } = await db.from("studio_assets").select("id, kind, mime").in("id", p.assetIds);
  const assets = p.assetIds.map((id) => rows?.find((r) => r.id === id)).filter(Boolean) as { id: string; kind: "image" | "video"; mime: string }[];
  if (assets.length !== p.assetIds.length) return { ok: false, error: "A selected file no longer exists." };

  let when: string | null = null;
  if (p.mode === "schedule") {
    if (!p.scheduledAt) return { ok: false, error: "Pick a date and time." };
    const t = new Date(p.scheduledAt).getTime();
    if (t < Date.now() - 60_000) return { ok: false, error: "That time is in the past. Use “Publish now” or pick a later time." };
    if (t > Date.now() + 75 * 86400_000) return { ok: false, error: "Schedule at most 75 days ahead (Instagram tokens last 60 days and are renewed automatically)." };
    when = new Date(t).toISOString();
  }
  if (p.mode === "now") when = new Date().toISOString();

  const { data: igAccount } = await db.from("studio_accounts").select("id").eq("platform", "instagram").order("created_at").limit(1).maybeSingle();
  for (const t of p.targets) {
    const problem = mediaProblem(t.platform as Platform, t.format as Format, assets);
    if (problem) return { ok: false, error: `${t.platform === "instagram" ? "Instagram" : "TikTok"}: ${problem}` };
    const check = checkCaption(t.platform as Platform, p.caption, hashtags);
    if (!check.ok) return { ok: false, error: `${t.platform === "instagram" ? "Instagram" : "TikTok"}: ${check.problems[0]}` };
    if (t.platform === "instagram" && p.mode !== "draft" && !igAccount) return { ok: false, error: "Connect an Instagram account under Accounts before scheduling Instagram posts." };
  }

  const status = p.mode === "draft" ? "draft" : "scheduled";
  const ids: string[] = [];
  for (const t of p.targets) {
    const row = {
      platform: t.platform, format: t.format, caption: p.caption.trim(), hashtags, asset_ids: p.assetIds,
      scheduled_at: when ?? (p.scheduledAt ? new Date(p.scheduledAt).toISOString() : null), status,
      account_id: t.platform === "instagram" ? igAccount?.id ?? null : null,
      error: null, attempts: 0, ig_state: {}, locked_until: null, started_at: null, updated_at: new Date().toISOString(),
    };
    if (p.id) {
      const { data, error } = await db.from("studio_posts").update(row).eq("id", p.id).in("status", ["draft", "scheduled", "failed", "ready", "cancelled"]).select("id").maybeSingle();
      if (error || !data) return { ok: false, error: "This post can't be edited any more (it may be publishing or already published)." };
      ids.push(data.id);
    } else {
      const { data, error } = await db.from("studio_posts").insert({ ...row, created_by: me.email }).select("id").single();
      if (error || !data) { console.error("[studio] savePost", error?.message); return { ok: false, error: "Could not save the post." }; }
      ids.push(data.id);
    }
  }

  let message = p.mode === "draft" ? "Saved as a draft." : p.mode === "schedule" ? "Scheduled." : "Publishing started.";
  if (p.mode === "now") {
    const report = await runNow(ids);
    if (report) message = report;
  }
  revalidatePath("/studio", "layout");
  return { ok: true, ids, message };
}

/** Runs the publisher for these posts right away and describes what happened. */
async function runNow(ids: string[]): Promise<string | null> {
  const db = await supabaseServer();
  const { data } = await db.from("studio_posts").select("id, platform").in("id", ids);
  const ig = (data ?? []).filter((d) => d.platform === "instagram");
  const tt = (data ?? []).filter((d) => d.platform === "tiktok");
  if (tt.length) await supabaseAdmin().from("studio_posts").update({ status: "ready" }).in("id", tt.map((t) => t.id)).eq("status", "scheduled");
  const parts: string[] = [];
  for (const p of ig) {
    const r = await tick({ postId: p.id });
    parts.push(r.published ? "Instagram: published." : r.failed ? "Instagram: failed — see the error on the Posts page." : "Instagram: Instagram is still processing the media; it will publish automatically within a few minutes.");
  }
  if (tt.length) parts.push("TikTok: ready — open it on the Today page to download the media and copy the caption.");
  return parts.join(" ") || null;
}

const statusUpdate = async (id: string, from: string[], patch: Record<string, unknown>, okMsg: string): Promise<Result> => {
  await requireMember();
  if (!Id.safeParse(id).success) return { ok: false, error: "Invalid post." };
  const db = await supabaseServer();
  const { data } = await db.from("studio_posts").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).in("status", from).select("id").maybeSingle();
  revalidatePath("/studio", "layout");
  return data ? { ok: true, message: okMsg } : { ok: false, error: "That post changed in the meantime. Refresh and try again." };
};

export async function cancelPost(id: string) {
  return statusUpdate(id, ["draft", "scheduled", "failed", "ready"], { status: "cancelled", locked_until: null }, "Cancelled.");
}
export async function markPosted(id: string) {
  return statusUpdate(id, ["ready", "scheduled", "draft", "failed"], { status: "posted_manually", published_at: new Date().toISOString() }, "Marked as posted.");
}
export async function retryPost(id: string): Promise<Result> {
  const r = await statusUpdate(id, ["failed"], { status: "scheduled", scheduled_at: new Date().toISOString(), error: null, attempts: 0, ig_state: {}, started_at: null, locked_until: null }, "Retrying now.");
  if (!r.ok) return r;
  const msg = await runNow([id]);
  revalidatePath("/studio", "layout");
  return { ok: true, message: msg ?? r.message };
}
export async function publishNow(id: string): Promise<Result> {
  const r = await statusUpdate(id, ["draft", "scheduled"], { status: "scheduled", scheduled_at: new Date().toISOString() }, "Publishing.");
  if (!r.ok) return r;
  const msg = await runNow([id]);
  revalidatePath("/studio", "layout");
  return { ok: true, message: msg ?? r.message };
}
export async function deletePost(id: string): Promise<Result> {
  await requireMember();
  if (!Id.safeParse(id).success) return { ok: false, error: "Invalid post." };
  const db = await supabaseServer();
  const { data } = await db.from("studio_posts").delete().eq("id", id).neq("status", "publishing").select("id").maybeSingle();
  revalidatePath("/studio", "layout");
  return data ? { ok: true, message: "Deleted. (Anything already published stays on Instagram.)" } : { ok: false, error: "Can't delete a post while it's publishing." };
}

/* ---------- Accounts ---------- */

export async function disconnectAccount(id: string): Promise<Result> {
  await requireMember();
  if (!Id.safeParse(id).success) return { ok: false, error: "Invalid account." };
  const admin = supabaseAdmin();
  await admin.from("studio_posts").update({ status: "draft", account_id: null }).eq("account_id", id).eq("status", "scheduled");
  await admin.from("studio_accounts").delete().eq("id", id); // cascades to the encrypted token
  revalidatePath("/studio", "layout");
  return { ok: true, message: "Disconnected. Its scheduled posts were moved back to drafts. To fully revoke access, also remove the app in Instagram → Settings → Website permissions / Apps." };
}

/* ---------- Team ---------- */

export async function addMember(_: Result, form: FormData): Promise<Result> {
  const me = await requireOwner();
  const email = z.string().trim().toLowerCase().email().max(254).safeParse(form.get("email"));
  const role = z.enum(["member", "owner"]).safeParse(form.get("role") ?? "member");
  if (!email.success || !role.success) return { ok: false, error: "Enter a valid email." };
  const db = await supabaseServer();
  const { count } = await db.from("studio_members").select("email", { count: "exact", head: true });
  if ((count ?? 0) >= 10) return { ok: false, error: "Studio is limited to 10 team members." };
  const { error } = await db.from("studio_members").upsert({ email: email.data, role: role.data, added_by: me.email });
  if (error) return { ok: false, error: "Could not add that person." };
  revalidatePath("/studio/team");
  return { ok: true, message: `${email.data} can now sign in at this Studio address with a code sent to that email.` };
}

export async function removeMember(email: string): Promise<Result> {
  const me = await requireOwner();
  if (email === me.email) return { ok: false, error: "You can't remove yourself." };
  const db = await supabaseServer();
  const { error } = await db.from("studio_members").delete().eq("email", email);
  revalidatePath("/studio/team");
  return error ? { ok: false, error: "Could not remove." } : { ok: true, message: "Removed. They lose access to Studio data immediately." };
}
