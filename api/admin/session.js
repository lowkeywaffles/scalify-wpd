// GET: who is signed in. POST {email}: email a code. POST {email, code}: sign in (operators only). DELETE: sign out.
import { currentOperator, sendCode, signOut, verifyCode } from "../_lib/auth.js";
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
  const code = typeof b?.code === "string" ? b.code.replace(/\s/g, "") : "";
  if (!email) return send(res, 400, { error: "Enter your email." });
  if (!code) {
    if (!rateLimit(`otp:${ip}`, 5, 15 * 60_000) || !rateLimit(`otp:${email.toLowerCase()}`, 5, 3600_000)) return send(res, 429, { error: "Too many codes requested. Wait 15 minutes." });
    const r = await sendCode(email);
    return r.ok ? send(res, 200, { sent: true }) : send(res, 429, { error: r.error });
  }
  if (!/^\d{6,10}$/.test(code)) return send(res, 400, { error: "The code is the numbers from the email." });
  if (!rateLimit(`verify:${ip}`, 10, 15 * 60_000) || !rateLimit(`verify:${email.toLowerCase()}`, 10, 3600_000)) return send(res, 429, { error: "Too many tries. Wait 15 minutes." });
  const r = await verifyCode(res, email, code);
  return r.ok ? send(res, 200, { email: r.email }) : send(res, 401, { error: r.error });
});
