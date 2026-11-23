// Products sold without user accounts, and the shared payment details. Single source of truth for prices.

const num = (name, fallback, min, max) => {
  const n = Number(process.env[name] ?? fallback);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

export const STORE_PRODUCTS = {
  brimful: {
    name: "Brimful Plus",
    priceEtb: () => Math.round(num("STORE_BRIMFUL_PRICE_ETB", 500, 10, 100000)),
    priceUsd: () => Math.round(num("STORE_BRIMFUL_PRICE_USD", 7, 1, 100) * 100) / 100,
    whopPlan: () => process.env.BRIMFUL_WHOP_PLAN_ID || "",
    whopProduct: () => process.env.BRIMFUL_WHOP_PRODUCT_ID || "",
    returnUrl: "https://www.brimful.tech/app/#/unlock",
  },
};
export const isStoreProduct = (p) => typeof p === "string" && Object.hasOwn(STORE_PRODUCTS, p);

export const LOCAL_PAY = {
  telebirr: { label: "Telebirr", accountName: "Amanuel" },
  boa: { label: "Bank of Abyssinia", accountName: "Amanuel Yared", accountNumber: "270290377" },
};
export const METHOD_LABEL = { telebirr: "Telebirr", boa: "Bank of Abyssinia", whop: "Card (Whop)", comp: "Complimentary" };

// QuoteRevive's FIRST6 offer: spots are shared between Whop checkout and birr payments.
export const FIRST6 = { code: "FIRST6", whopPromoId: "promo_IOC4zrQD2TMN" };

export const SITE = "https://scalify-wpd.vercel.app";
