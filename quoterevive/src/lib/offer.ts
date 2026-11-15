/** Single source of truth for the offer — used on pricing, billing, terms and refund pages. */
export const PRICE = {
  name: "QuoteRevive Founding Access",
  display: "$39 USD, one-time",
  summary:
    "One payment of $39 USD through Whop. No subscription and no automatic renewal. Whop may add sales tax/VAT at checkout depending on your location — the final total is shown by Whop before you pay.",
  term:
    "Access to the current MVP features for as long as QuoteRevive operates the service, and for at least 24 months from purchase. If we ever shut down, we will give at least 60 days' notice and a full data export.",
  allowance: "Includes up to 2,000 quotes in one business workspace for one user.",
  free: "Free workspace: up to 10 quotes, all features, no card needed.",
};

/** Local payment in Ethiopian birr, verified by hand. Price is set by env so it can follow the exchange rate. */
export const ETB_PRICE = (() => {
  const n = Number(process.env.ETB_PRICE_FOUNDING ?? "4000");
  return Number.isFinite(n) && n >= 100 && n <= 100000 ? Math.round(n) : 4000;
})();
export const FIRST6 = { code: "FIRST6", percentOff: 50, endsAt: "2026-11-18T20:59:00.000Z", spots: 6, whopPromoId: "promo_IOC4zrQD2TMN" } as const;
export const first6Active = (now = Date.now()) => now < Date.parse(FIRST6.endsAt);
export const etbWithPromo = (promo: boolean) => (promo ? Math.round(ETB_PRICE * (1 - FIRST6.percentOff / 100)) : ETB_PRICE);
export const formatEtb = (n: number) => `${n.toLocaleString("en-US")} ETB`;

export const LOCAL_PAY = {
  telebirr: { label: "Telebirr", accountName: "Amanuel", qr: "/pay/telebirr-qr.jpg", hint: "Scan the QR with the Telebirr app (Pay / Send money)." },
  boa: { label: "Bank of Abyssinia", accountName: "Amanuel Yared", accountNumber: "270290377", hint: "Transfer from any bank app or branch." },
} as const;
export type LocalMethod = keyof typeof LOCAL_PAY;
