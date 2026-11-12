import "server-only";
import { BUCKET } from "./publisher";
import { supabaseAdmin, supabaseServer } from "./supabase/server";

export type AssetRow = { id: string; path: string; kind: "image" | "video"; mime: string; size_bytes: number; label: string | null; created_at: string; url?: string; downloadUrl?: string };
export type PostRow = {
  id: string; platform: "instagram" | "tiktok"; format: string; account_id: string | null; caption: string; hashtags: string[];
  asset_ids: string[]; scheduled_at: string | null; status: string; permalink: string | null; error: string | null;
  published_at: string | null; created_by: string | null; created_at: string;
};
export const POST_COLS = "id, platform, format, account_id, caption, hashtags, asset_ids, scheduled_at, status, permalink, error, published_at, created_by, created_at";

/** Adds 1-hour signed preview URLs. Call only after requireMember(). */
export async function withUrls(assets: AssetRow[]): Promise<AssetRow[]> {
  if (!assets.length) return assets;
  const store = supabaseAdmin().storage.from(BUCKET);
  const paths = assets.map((a) => a.path);
  const [view, dl] = await Promise.all([store.createSignedUrls(paths, 3600), store.createSignedUrls(paths, 3600, { download: true })]);
  return assets.map((a) => ({
    ...a,
    url: view.data?.find((d) => d.path === a.path)?.signedUrl ?? undefined,
    downloadUrl: dl.data?.find((d) => d.path === a.path)?.signedUrl ?? undefined,
  }));
}

export async function listAssets(limit = 120): Promise<AssetRow[]> {
  const db = await supabaseServer();
  const { data } = await db.from("studio_assets").select("id, path, kind, mime, size_bytes, label, created_at").order("created_at", { ascending: false }).limit(limit);
  return withUrls((data ?? []) as AssetRow[]);
}

export async function listAccounts() {
  const db = await supabaseServer();
  const { data } = await db.from("studio_accounts").select("id, platform, external_id, username, token_expires_at, connected_by, created_at").order("created_at");
  return data ?? [];
}

export async function postsWithAssets(posts: PostRow[]): Promise<Map<string, AssetRow>> {
  const ids = [...new Set(posts.flatMap((p) => p.asset_ids))];
  if (!ids.length) return new Map();
  const db = await supabaseServer();
  const { data } = await db.from("studio_assets").select("id, path, kind, mime, size_bytes, label, created_at").in("id", ids);
  const withU = await withUrls((data ?? []) as AssetRow[]);
  return new Map(withU.map((a) => [a.id, a]));
}
