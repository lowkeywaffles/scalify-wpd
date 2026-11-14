import "server-only";
import { publicEnv } from "./env";

/** Instagram API with Unified Login (Meta's only option for new apps, Nov 2026): Facebook Login for Business with a
 *  configuration (config_id). The person logs in with Instagram or Facebook, picks the Instagram professional account,
 *  and we receive a Business Integration System User Access Token. API host: graph.facebook.com.
 *  Credentials are the Meta app's own App ID and App secret (App settings → Basic). */
export const IG_VERSION = process.env.INSTAGRAM_API_VERSION || "v27.0";
const GRAPH = "https://graph.facebook.com";

const appId = (): string => (process.env.INSTAGRAM_APP_ID ?? "").trim();
const appSecret = (): string => (process.env.INSTAGRAM_APP_SECRET ?? "").trim();
const configId = (): string => (process.env.INSTAGRAM_CONFIG_ID ?? "").trim();
export const igConfigIdForDisplay = () => configId();

/** The app ID is public (it appears in the login URL), so it is safe to display for troubleshooting. */
export const igAppIdForDisplay = () => appId();

export function igConfigured(): boolean {
  return Boolean(appId() && appSecret() && configId() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
export const igRedirectUri = () => `${publicEnv.siteUrl}/api/instagram/callback`;

export class IgError extends Error {
  constructor(message: string, public transient: boolean, public code?: number) { super(message); }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    throw new IgError(`Network error talking to Instagram: ${e instanceof Error ? e.message : "unknown"}`, true);
  }
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON error page */ }
  if (!res.ok || json.error) {
    const err = (json.error ?? {}) as { message?: string; code?: number; is_transient?: boolean; error_user_msg?: string };
    const code = typeof err.code === "number" ? err.code : undefined;
    const transient = Boolean(err.is_transient) || res.status >= 500 || [1, 2, 4, 17, 32, 613].includes(code ?? -1);
    const msg = (err.error_user_msg || err.message || (typeof json.error_message === "string" ? json.error_message : "") || `HTTP ${res.status}`).slice(0, 400);
    throw new IgError(msg, transient, code);
  }
  return json as T;
}

const form = (params: Record<string, string>) => ({
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(params).toString(),
});

export function authorizeUrl(state: string): string {
  const u = new URL(`https://www.facebook.com/${IG_VERSION}/dialog/oauth`);
  u.searchParams.set("client_id", appId());
  u.searchParams.set("config_id", configId());
  u.searchParams.set("redirect_uri", igRedirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "login");
  return u.toString();
}

export type ConnectedAccount = { igId: string; username: string };

/** code -> Business Integration System User Access Token -> the Instagram accounts the person shared. */
export async function exchangeCode(code: string): Promise<{ token: string; expiresAt: Date | null; accounts: ConnectedAccount[] }> {
  const tok = await call<{ access_token: string; expires_in?: number }>(
    `${GRAPH}/${IG_VERSION}/oauth/access_token?${new URLSearchParams({ client_id: appId(), client_secret: appSecret(), redirect_uri: igRedirectUri(), code })}`,
  );
  if (!tok.access_token) throw new IgError("Meta did not return an access token", false);
  const list = await call<{ data?: { id: string; username?: string }[] }>(
    `${GRAPH}/${IG_VERSION}/me/assigned_instagram_accounts?${new URLSearchParams({ fields: "id,username", access_token: tok.access_token })}`,
  );
  const accounts = (list.data ?? []).filter((a) => a.id).map((a) => ({ igId: String(a.id), username: a.username ?? String(a.id) }));
  if (!accounts.length) throw new IgError("No Instagram account was shared. Connect again and select the Instagram account.", false);
  return { token: tok.access_token, expiresAt: tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000) : null, accounts };
}

export type ContainerInput =
  | { type: "image"; url: string; caption?: string; carouselItem?: boolean }
  | { type: "video"; url: string; caption?: string; carouselItem?: boolean }
  | { type: "reel"; url: string; caption: string }
  | { type: "carousel"; children: string[]; caption: string };

export async function createContainer(igId: string, token: string, c: ContainerInput): Promise<string> {
  const p: Record<string, string> = { access_token: token };
  if (c.type === "image") { p.image_url = c.url; if (c.carouselItem) p.is_carousel_item = "true"; else if (c.caption) p.caption = c.caption; }
  if (c.type === "video") { p.media_type = "VIDEO"; p.video_url = c.url; p.is_carousel_item = "true"; }
  if (c.type === "reel") { p.media_type = "REELS"; p.video_url = c.url; p.caption = c.caption; }
  if (c.type === "carousel") { p.media_type = "CAROUSEL"; p.children = c.children.join(","); p.caption = c.caption; }
  const r = await call<{ id: string }>(`${GRAPH}/${IG_VERSION}/${igId}/media`, form(p));
  return r.id;
}

export type ContainerStatus = "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";
export async function containerStatus(containerId: string, token: string): Promise<{ code: ContainerStatus; detail?: string }> {
  const r = await call<{ status_code: ContainerStatus; status?: string }>(
    `${GRAPH}/${IG_VERSION}/${containerId}?${new URLSearchParams({ fields: "status_code,status", access_token: token })}`,
  );
  return { code: r.status_code, detail: r.status };
}

export async function publishContainer(igId: string, token: string, containerId: string): Promise<string> {
  const r = await call<{ id: string }>(`${GRAPH}/${IG_VERSION}/${igId}/media_publish`, form({ creation_id: containerId, access_token: token }));
  return r.id;
}

export async function mediaPermalink(mediaId: string, token: string): Promise<string | null> {
  try {
    const r = await call<{ permalink?: string }>(`${GRAPH}/${IG_VERSION}/${mediaId}?${new URLSearchParams({ fields: "permalink", access_token: token })}`);
    return r.permalink ?? null;
  } catch { return null; }
}
