"use client";
import { Check, Copy, Lightbulb, Link2, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { OBJECTIONS, Tip } from "@/lib/coach";
import { buildMessage, isRtl, Lang, LANGUAGE_LABEL, LANGUAGES, mailtoLink, TONE_LABEL, TONES, Tone, whatsappLink } from "@/lib/templates";
import { Channel, Quote, QuoteStatus } from "@/lib/types";
import { Celebration } from "./Celebration";
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
export type ShareApi = {
  url: string | null; // full link when enabled
  onChange: (mode: "enable" | "disable" | "regenerate") => Promise<Result & { token?: string | null }>;
  base: string;
};

export function FollowUpAssistant({ quote, businessName, previousFollowUps, todayIso, recommended, onRecord, defaultChannel = "whatsapp", defaultLang = "en", tips = [], share }: {
  quote: Quote; businessName?: string; previousFollowUps: number; todayIso: string;
  recommended: { date: string | null; reason: string }; defaultChannel?: Channel; defaultLang?: Lang; tips?: Tip[];
  onRecord: (input: RecordInput) => Promise<Result>; share?: ShareApi;
}) {
  const [tone, setTone] = useState<Tone>(previousFollowUps >= 2 ? "final" : "friendly");
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [shareUrl, setShareUrl] = useState<string | null>(share?.url ?? null);
  const [withLink, setWithLink] = useState(Boolean(share?.url));
  const generated = useMemo(() => {
    const base = buildMessage(quote, tone, { businessName, todayIso, previousFollowUps, lang });
    return withLink && shareUrl ? `${base}\n\n${shareUrl}` : base;
  }, [quote, tone, businessName, todayIso, previousFollowUps, lang, withLink, shareUrl]);
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? generated;
  const [copied, setCopied] = useState<"msg" | "link" | null>(null);
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<"none" | "sent" | "response">("none");
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [nextDate, setNextDate] = useState("");
  const [summary, setSummary] = useState("");
  const [newStatus, setNewStatus] = useState<QuoteStatus>("negotiating");
  const [contributed, setContributed] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [pending, start] = useTransition();
  const sentBtn = useRef<HTMLButtonElement>(null);
  const closed = ["accepted", "rejected", "expired"].includes(quote.status) || quote.archived || quote.opted_out;
  const first = quote.customer_name.trim().split(/\s+/)[0] || "there";

  async function copy(value: string, what: "msg" | "link") {
    try { await navigator.clipboard.writeText(value); setCopied(what); setTimeout(() => setCopied(null), 2000); }
    catch { setResult({ error: "Copy failed — select the text and copy it manually." }); }
  }
  function submit(input: RecordInput) {
    start(async () => {
      const r = await onRecord(input);
      setResult(r);
      if (r.ok) {
        if (input.new_status === "accepted") setCelebrate(true);
        setMode("none"); setSummary(""); setNextDate(""); setOpened(false); setEdited(null);
        requestAnimationFrame(() => sentBtn.current?.focus());
      }
    });
  }
  function changeShare(m: "enable" | "disable" | "regenerate") {
    if (!share) return;
    start(async () => {
      const r = await share.onChange(m);
      setResult(r);
      if (r.ok) { const url = r.token ? `${share.base}/q/${r.token}` : null; setShareUrl(url); setWithLink(Boolean(url)); setEdited(null); }
    });
  }

  return (
    <section id="follow-up" aria-labelledby="fua-title" className="card scroll-mt-24 space-y-5 p-4 sm:p-6" data-tour="assistant">
      {celebrate && <Celebration onDone={() => setCelebrate(false)} />}
      <div>
        <h2 id="fua-title" className="font-display text-2xl">Follow-up assistant</h2>
        {closed ? <p className="mt-1 text-sm text-muted">This quote is closed, archived or opted out, so no follow-up is suggested.</p>
          : <p className="mt-1 text-sm text-muted">Suggested next follow-up: <strong className="text-ink">{recommended.date ?? "none"}</strong> — {recommended.reason}</p>}
      </div>

      {tips.length > 0 && !closed && (
        <aside aria-label="Message coach" className="rounded-2xl border border-line bg-surface-2/60 p-4" data-tour="coach">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-warn" aria-hidden="true" /> Coach</p>
          <ul className="space-y-1.5 text-sm">{tips.map((t) => <li key={t.id} className="flex gap-2"><span aria-hidden="true" className="text-muted">•</span>{t.text}</li>)}</ul>
        </aside>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <fieldset>
          <legend className="label">Tone</legend>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <label key={t} className={`cursor-pointer rounded-full border px-3 py-2 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)] ${tone === t ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-muted"}`}>
                <input type="radio" name="tone" value={t} checked={tone === t} onChange={() => { setTone(t); setEdited(null); }} className="sr-only" />{TONE_LABEL[t]}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="fua-lang" className="label">Language</label>
          <select id="fua-lang" className="input" value={lang} onChange={(e) => { setLang(e.target.value as Lang); setEdited(null); }}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_LABEL[l]}</option>)}
          </select>
        </div>
      </div>

      {!closed && (
        <details className="group text-sm">
          <summary className="cursor-pointer font-semibold text-accent">They replied with an objection? Use a reply</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {OBJECTIONS.map((o) => <button key={o.id} type="button" className="rounded-full border border-line px-3 py-2 hover:border-accent" onClick={() => setEdited(o.text(first, quote.title))}>{o.label}</button>)}
          </div>
          <p className="hint mt-1">Objection replies are in English. Edit them before sending.</p>
        </details>
      )}

      <div>
        <label htmlFor="fua-msg" className="label">Message (edit freely)</label>
        <textarea id="fua-msg" className="input min-h-40 leading-relaxed" value={text} onChange={(e) => setEdited(e.target.value)} maxLength={2400} dir={isRtl(lang) ? "rtl" : "auto"} lang={lang} />
        {lang !== "en" && <p className="hint mt-1">Translated template — read it through before sending.</p>}
      </div>

      <div className="flex flex-wrap gap-2" data-tour="send">
        <button type="button" className="btn btn-primary" onClick={() => copy(text, "msg")}>{copied === "msg" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied === "msg" ? "Copied" : "Copy message"}</button>
        <a className="btn btn-ghost" href={whatsappLink(quote.customer_phone, text)} target="_blank" rel="noopener noreferrer" onClick={() => setOpened(true)}><MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp<span className="sr-only"> (opens in a new tab)</span></a>
        <a className="btn btn-ghost" href={mailtoLink(quote.customer_email, `Following up: ${quote.title}`, text)} onClick={() => setOpened(true)}><Mail className="h-4 w-4" aria-hidden="true" />Email draft</a>
      </div>
      <p className="hint -mt-2" aria-live="polite">{opened ? "Opened your app. Nothing has been sent yet — once you actually send it, mark it as sent below." : "QuoteRevive never sends messages for you. You send them from your own app."}</p>

      {share && (
        <div className="rounded-2xl border border-line p-4" data-tour="share">
          <p className="flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4 text-accent" aria-hidden="true" /> Customer quote link</p>
          <p className="mt-1 text-sm text-muted">A private page where {first} can accept, ask a question or say &quot;not now&quot; in one tap. Their answer lands here automatically.</p>
          {shareUrl ? (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <input aria-label="Customer link" readOnly value={shareUrl} className="input min-w-0 flex-1 text-sm" onFocus={(e) => e.currentTarget.select()} />
                <button type="button" className="btn btn-ghost" onClick={() => copy(shareUrl, "link")}>{copied === "link" ? "Copied" : "Copy link"}</button>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={withLink} onChange={(e) => { setWithLink(e.target.checked); setEdited(null); }} /> Add the link to the message</label>
              <div className="flex flex-wrap gap-3 text-sm">
                <button type="button" className="link" disabled={pending} onClick={() => changeShare("regenerate")}><RefreshCw className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />New link</button>
                <button type="button" className="link" disabled={pending} onClick={() => changeShare("disable")}>Turn off link</button>
              </div>
            </div>
          ) : <button type="button" className="btn btn-ghost mt-3" disabled={pending || closed} onClick={() => changeShare("enable")}>Create customer link</button>}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <button ref={sentBtn} type="button" className="btn btn-ghost" aria-expanded={mode === "sent"} onClick={() => setMode(mode === "sent" ? "none" : "sent")} disabled={closed}>I sent this follow-up</button>
        <button type="button" className="btn btn-ghost" aria-expanded={mode === "response"} onClick={() => setMode(mode === "response" ? "none" : "response")}>Record customer response</button>
      </div>

      {mode === "sent" && (
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit({ quote_id: quote.id, kind: "follow_up", channel, summary: `${TONE_LABEL[tone]} message${lang !== "en" ? ` (${lang})` : ""}`, next_follow_up_at: nextDate || undefined }); }}>
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
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); submit({ quote_id: quote.id, kind: "customer_response", summary, new_status: newStatus, contributed_to_sale: newStatus === "accepted" ? contributed : undefined, next_follow_up_at: nextDate || undefined }); }}>
          <div>
            <label htmlFor="fua-sum" className="label">What did they say? <span className="font-normal text-muted">(optional)</span></label>
            <input id="fua-sum" className="input" value={summary} maxLength={500} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. Wants a lower price for 2 signs" dir="auto" />
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
      <div aria-live="polite">{result?.error ? <Notice kind="error">{result.error}</Notice> : result?.message ? <Notice kind="ok">{result.message}</Notice> : null}</div>
    </section>
  );
}
