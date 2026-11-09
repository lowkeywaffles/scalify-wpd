"use client";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { buildMessage, mailtoLink, TONE_LABEL, TONES, Tone, whatsappLink } from "@/lib/templates";
import { Channel, Quote, QuoteStatus } from "@/lib/types";
import { Notice } from "./ui";

export interface RecordInput {
  quote_id: string;
  kind: "follow_up" | "customer_response" | "note";
  channel?: Channel | null;
  summary?: string;
  new_status?: QuoteStatus;
  next_follow_up_at?: string;
  contributed_to_sale?: boolean;
}
type Result = { ok?: boolean; error?: string; message?: string };

export function FollowUpAssistant({ quote, businessName, previousFollowUps, todayIso, recommended, onRecord, defaultChannel = "whatsapp" }: {
  quote: Quote; businessName?: string; previousFollowUps: number; todayIso: string;
  recommended: { date: string | null; reason: string }; defaultChannel?: Channel;
  onRecord: (input: RecordInput) => Promise<Result>;
}) {
  const [tone, setTone] = useState<Tone>(previousFollowUps >= 2 ? "final" : "friendly");
  const generated = useMemo(() => buildMessage(quote, tone, { businessName, todayIso, previousFollowUps }), [quote, tone, businessName, todayIso, previousFollowUps]);
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? generated;
  const [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<"none" | "sent" | "response">("none");
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [nextDate, setNextDate] = useState("");
  const [summary, setSummary] = useState("");
  const [newStatus, setNewStatus] = useState<QuoteStatus>("negotiating");
  const [contributed, setContributed] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const sentBtn = useRef<HTMLButtonElement>(null);
  const closed = ["accepted", "rejected", "expired"].includes(quote.status) || quote.archived || quote.opted_out;

  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setResult({ error: "Copy failed — select the text and copy it manually." }); }
  }
  function submit(input: RecordInput) {
    start(async () => {
      const r = await onRecord(input);
      setResult(r);
      if (r.ok) { setMode("none"); setSummary(""); setNextDate(""); setOpened(false); setEdited(null); requestAnimationFrame(() => sentBtn.current?.focus()); }
    });
  }

  return (
    <section id="follow-up" aria-labelledby="fua-title" className="card scroll-mt-24 p-4 sm:p-6">
      <h2 id="fua-title" className="font-display text-2xl">Follow-up assistant</h2>
      {closed ? (
        <p className="mt-2 text-sm text-muted">This quote is closed, archived or opted out, so no follow-up is suggested.</p>
      ) : (
        <p className="mt-1 text-sm text-muted">Suggested next follow-up: <strong className="text-ink">{recommended.date ?? "none"}</strong> — {recommended.reason}</p>
      )}

      <fieldset className="mt-4">
        <legend className="label">Tone</legend>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <label key={t} className={`cursor-pointer rounded-full border px-3 py-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)] ${tone === t ? "border-accent bg-accent-soft text-accent" : "border-line"}`}>
              <input type="radio" name="tone" value={t} checked={tone === t} onChange={() => { setTone(t); setEdited(null); }} className="sr-only" />
              {TONE_LABEL[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor="fua-msg" className="label mt-4">Message (edit freely)</label>
      <textarea id="fua-msg" className="input min-h-36 leading-relaxed" value={text} onChange={(e) => setEdited(e.target.value)} maxLength={2000} />

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={copy}>{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? "Copied" : "Copy message"}</button>
        <a className="btn btn-ghost" href={whatsappLink(quote.customer_phone, text)} target="_blank" rel="noopener noreferrer" onClick={() => setOpened(true)}>
          <MessageCircle className="h-4 w-4" aria-hidden="true" />Open WhatsApp<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a className="btn btn-ghost" href={mailtoLink(quote.customer_email, `Following up: ${quote.title}`, text)} onClick={() => setOpened(true)}>
          <Mail className="h-4 w-4" aria-hidden="true" />Open email draft
        </a>
      </div>
      <p className="hint mt-2" aria-live="polite">
        {opened ? "Opened your app. Nothing has been sent yet — once you actually send it, mark it as sent below." : "QuoteRevive never sends messages for you. You send them from your own app."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <button ref={sentBtn} type="button" className="btn btn-ghost" aria-expanded={mode === "sent"} onClick={() => setMode(mode === "sent" ? "none" : "sent")} disabled={closed}>I sent this follow-up</button>
        <button type="button" className="btn btn-ghost" aria-expanded={mode === "response"} onClick={() => setMode(mode === "response" ? "none" : "response")}>Record customer response</button>
      </div>

      {mode === "sent" && (
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit({ quote_id: quote.id, kind: "follow_up", channel, summary: `${TONE_LABEL[tone]} message`, next_follow_up_at: nextDate || undefined }); }}>
          <div>
            <label htmlFor="fua-ch" className="label">Sent via</label>
            <select id="fua-ch" className="input" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              <option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="phone">Phone</option><option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="fua-next" className="label">Next follow-up <span className="font-normal text-muted">(optional)</span></label>
            <input id="fua-next" type="date" className="input" value={nextDate} min={todayIso} onChange={(e) => setNextDate(e.target.value)} aria-describedby="fua-next-hint" />
            <p id="fua-next-hint" className="hint mt-1">Leave blank to use the suggested schedule.</p>
          </div>
          <button className="btn btn-primary sm:col-span-2" disabled={pending}>{pending ? "Saving…" : "Save follow-up"}</button>
        </form>
      )}

      {mode === "response" && (
        <form className="mt-4 grid gap-3" onSubmit={(e) => { e.preventDefault(); submit({ quote_id: quote.id, kind: "customer_response", summary, new_status: newStatus, contributed_to_sale: newStatus === "accepted" ? contributed : undefined, next_follow_up_at: nextDate || undefined }); }}>
          <div>
            <label htmlFor="fua-sum" className="label">What did they say? <span className="font-normal text-muted">(optional)</span></label>
            <input id="fua-sum" className="input" value={summary} maxLength={500} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. Wants a lower price for 2 signs" />
            <p className="hint mt-1">Keep it short. Avoid sensitive personal details.</p>
          </div>
          <div>
            <label htmlFor="fua-st" className="label">New status</label>
            <select id="fua-st" className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value as QuoteStatus)}>
              <option value="negotiating">Negotiating</option><option value="awaiting_response">Still deciding</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option>
            </select>
          </div>
          {newStatus === "accepted" && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4" checked={contributed} onChange={(e) => setContributed(e.target.checked)} />
              <span>A follow-up helped win this. <span className="text-muted">(Your judgement only — QuoteRevive can&apos;t verify cause and effect.)</span></span>
            </label>
          )}
          {["negotiating", "awaiting_response"].includes(newStatus) && (
            <div>
              <label htmlFor="fua-next2" className="label">Next follow-up <span className="font-normal text-muted">(optional)</span></label>
              <input id="fua-next2" type="date" className="input" value={nextDate} min={todayIso} onChange={(e) => setNextDate(e.target.value)} />
            </div>
          )}
          <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save response"}</button>
        </form>
      )}
      <div className="mt-3" aria-live="polite">{result?.error ? <Notice kind="error">{result.error}</Notice> : result?.message ? <Notice kind="ok">{result.message}</Notice> : null}</div>
    </section>
  );
}
