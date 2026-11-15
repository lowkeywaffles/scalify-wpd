// Operator-only Telegram setup.
//   GET                      -> { configured, linked, bot }
//   POST {action:"start"}    -> { code, link }   (open the link in Telegram and press Start)
//   POST {action:"finish"}   -> finds the chat that sent the code and saves it for alerts
//   POST {action:"test"}     -> sends a test alert
//   POST {action:"unlink"}   -> stops alerts
import { randomInt } from "node:crypto";
import { currentOperator } from "../_lib/auth.js";
import { deleteSetting, getSetting, setSetting } from "../_lib/db.js";
import { body, handler, send, sameOrigin } from "../_lib/http.js";
import { announceNew, sendAlert, telegram, telegramConfigured } from "../_lib/notify.js";

async function botName() {
  const r = await telegram("getMe");
  return r.ok ? r.result?.username ?? null : null;
}

export default handler(["GET", "POST"], async (req, res) => {
  const who = await currentOperator(req, res);
  if (!who) return send(res, 401, { error: "Please sign in again." });
  if (!telegramConfigured()) return send(res, 200, { configured: false, linked: false });

  if (req.method === "GET") {
    const [chat, bot] = await Promise.all([getSetting("telegram"), botName()]);
    return send(res, 200, { configured: true, linked: Boolean(chat?.chat_id), linked_by: chat?.linked_by ?? null, bot });
  }
  if (!sameOrigin(req)) return send(res, 403, { error: "Not allowed" });
  const action = (await body(req))?.action;

  if (action === "start") {
    const bot = await botName();
    if (!bot) return send(res, 502, { error: "Telegram didn't accept the bot token. Check TELEGRAM_BOT_TOKEN in Vercel." });
    const code = String(randomInt(100000, 999999));
    await setSetting("telegram_link", { code, expires: Date.now() + 15 * 60_000 });
    return send(res, 200, { code, bot, link: `https://t.me/${bot}?start=${code}` });
  }
  if (action === "finish") {
    const pend = await getSetting("telegram_link");
    if (!pend?.code || Date.now() > pend.expires) return send(res, 409, { error: "That code expired. Start again." });
    const up = await telegram("getUpdates", { limit: 100, allowed_updates: ["message"] });
    if (!up.ok) return send(res, 502, { error: "Couldn't read messages from Telegram. Try again." });
    const hit = [...(up.result ?? [])].reverse().find((u) => u.message?.chat?.type === "private" && String(u.message?.text ?? "").trim() === `/start ${pend.code}`);
    if (!hit) return send(res, 404, { error: "No message with the code yet. In Telegram, open the bot and press Start, then try again." });
    await setSetting("telegram", { chat_id: hit.message.chat.id, linked_by: who, linked_at: new Date().toISOString() });
    await deleteSetting("telegram_link");
    // Acknowledge the updates we read so they aren't kept on Telegram's side.
    await telegram("getUpdates", { offset: hit.update_id + 1, limit: 1 });
    await sendAlert("Scalify payment alerts are on. You'll get a message here for each new payment.");
    await announceNew().catch(() => 0);
    return send(res, 200, { ok: true, message: "Linked. Check Telegram for a confirmation message." });
  }
  if (action === "test") {
    const ok = await sendAlert("Test alert from your Scalify payments admin.");
    return ok ? send(res, 200, { ok: true, message: "Sent. Check Telegram." }) : send(res, 502, { error: "Couldn't send. Link Telegram again." });
  }
  if (action === "unlink") {
    await deleteSetting("telegram");
    return send(res, 200, { ok: true, message: "Alerts are off." });
  }
  return send(res, 400, { error: "Invalid request." });
});
