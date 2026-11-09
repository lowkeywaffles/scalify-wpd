import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Standard Webhooks verification (used by Whop). Per Whop docs the `ws_` secret is used
 * as-is as the HMAC key. VERIFY against current Whop docs / their SDK before launch.
 */
export function signStandardWebhook(secret: string, id: string, timestamp: number, body: string): string {
  return createHmac("sha256", secret).update(`${id}.${timestamp}.${body}`).digest("base64");
}

export function verifyStandardWebhook(
  secret: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  rawBody: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): boolean {
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > toleranceSeconds) return false;
  const expected = Buffer.from(signStandardWebhook(secret, id, ts, rawBody));
  return signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/** Membership statuses that grant access, per Whop docs (completed = paid one-time). */
export const GRANTING_STATUSES = new Set(["active", "trialing", "completed"]);
