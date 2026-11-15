// GET: who is signed in. POST {email, password}: sign in (operators only). DELETE: sign out.
import { currentOperator, signIn, signOut } from "../_lib/auth.js";
import { body, handler, ipOf, rateLimit, send, sameOrigin } from "../_lib/http.js";

export default handler(["GET", "POST", "DELETE"], async (req, res) => {
  if (req.method === "GET") {
    const email = await currentOperator(req, res);
    return email ? send(res, 200, { email }) : send(res, 401, { error: "Not signed in" });
  }
  if (!sameOrigin(req)) return send(res, 403, { error: "Not allowed" });
  if (req.method === "DELETE") { await signOut(req, res); return send(res, 200, { ok: true }); }

  const ip = ipOf(req);
  const b = await body(req);
  const email = typeof b?.email === "string" ? b.email.trim().slice(0, 254) : "";
  const password = typeof b?.password === "string" ? b.password.slice(0, 200) : "";
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000) || !rateLimit(`login:${email.toLowerCase()}`, 10, 3600_000)) return send(res, 429, { error: "Too many sign-in attempts. Wait 15 minutes." });
  if (!email || !password) return send(res, 400, { error: "Enter your email and password." });
  const r = await signIn(res, email, password);
  return r.ok ? send(res, 200, { email: r.email }) : send(res, 401, { error: r.error });
});
