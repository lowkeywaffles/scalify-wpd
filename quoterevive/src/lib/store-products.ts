import "server-only";
import { LOCAL_PAY } from "./offer";

/** Products sold without user accounts. Prices come from env so they can change without a code change. */
const etb = (name: string, fallback: number) => {
  const n = Number(process.env[name] ?? fallback);
  return Number.isFinite(n) && n >= 10 && n <= 100000 ? Math.round(n) : fallback;
};
export const STORE_PRODUCTS = {
  brimful: { name: "Brimful Plus", priceEtb: () => etb("STORE_BRIMFUL_PRICE_ETB", 500) },
} as const;
export type StoreProduct = keyof typeof STORE_PRODUCTS;
export const isStoreProduct = (p: string): p is StoreProduct => Object.hasOwn(STORE_PRODUCTS, p);

/** Sites allowed to call the store API from a browser. */
export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = (process.env.STORE_ALLOWED_ORIGINS ?? "https://brimful.vercel.app").split(",").map((s) => s.trim()).filter(Boolean);
  const h: Record<string, string> = { Vary: "Origin", "Cache-Control": "no-store" };
  if (origin && allowed.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
    h["Access-Control-Max-Age"] = "600";
  }
  return h;
}

export const payMethods = () => ({
  telebirr: { label: LOCAL_PAY.telebirr.label, accountName: LOCAL_PAY.telebirr.accountName },
  boa: { label: LOCAL_PAY.boa.label, accountName: LOCAL_PAY.boa.accountName, accountNumber: LOCAL_PAY.boa.accountNumber },
});
