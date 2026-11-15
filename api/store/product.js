// GET /api/store/:product — price and how to pay. Public information only.
import { cors, handler, send } from "../_lib/http.js";
import { isStoreProduct, LOCAL_PAY, STORE_PRODUCTS } from "../_lib/products.js";

export default handler(["GET"], async (req, res) => {
  cors(req, res, "GET");
  if (req.method === "OPTIONS") return send(res, 204);
  const product = req.query.product;
  if (!isStoreProduct(product)) return send(res, 404, { error: "Unknown product" });
  const p = STORE_PRODUCTS[product];
  const card = Boolean(process.env.WHOP_API_KEY && p.whopPlan() && p.whopProduct());
  return send(res, 200, {
    product,
    name: p.name,
    price_etb: p.priceEtb(),
    currency: "ETB",
    methods: LOCAL_PAY,
    card: card ? { price_usd: p.priceUsd(), provider: "Whop" } : null,
  });
});
