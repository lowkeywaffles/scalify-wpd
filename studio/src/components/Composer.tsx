"use client";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { draftAction, savePost } from "@/app/studio/actions";
import { checkCaption, composeCaption, normalizeHashtags, type Platform } from "@/lib/captions";
import { FORMATS, mediaProblem, type Format } from "@/lib/rules";
import { AUDIENCES, GOALS, TONES, type AudienceKey, type Draft, type GoalKey, type ToneKey } from "@/lib/templates";
import { Thumb } from "./Thumb";

type Asset = { id: string; kind: "image" | "video"; mime: string; label: string | null; url?: string };
type Initial = { id: string; platform: Platform; format: Format; caption: string; hashtags: string[]; assetIds: string[]; scheduledAt: string | null };
const LANGS = ["English", "Amharic", "Arabic", "French", "Spanish"] as const;

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function Composer({ assets, igConnected, providerLabel, initial }: { assets: Asset[]; igConnected: boolean; providerLabel: string; initial?: Initial }) {
  const id = useId();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Record<Platform, boolean>>({ instagram: initial ? initial.platform === "instagram" : true, tiktok: initial ? initial.platform === "tiktok" : false });
  const [formats, setFormats] = useState<Record<Platform, Format>>({ instagram: initial?.platform === "instagram" ? initial.format : "image", tiktok: initial?.platform === "tiktok" ? initial.format : "video" });
  const [selected, setSelected] = useState<string[]>(initial?.assetIds ?? []);
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [tags, setTags] = useState((initial?.hashtags ?? []).map((t) => `#${t}`).join(" "));
  const [when, setWhen] = useState(toLocalInput(initial?.scheduledAt ?? null));
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const [brief, setBrief] = useState("");
  const [goal, setGoal] = useState<GoalKey>("product");
  const [tone, setTone] = useState<ToneKey>("friendly");
  const [audiences, setAudiences] = useState<AudienceKey[]>(["freelancers"]);
  const [language, setLanguage] = useState<(typeof LANGS)[number]>("English");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [aiNote, setAiNote] = useState("");
  const [aiPending, startAi] = useTransition();

  const active = (Object.keys(platforms) as Platform[]).filter((p) => platforms[p]);
  const chosen = selected.map((s) => assets.find((a) => a.id === s)).filter(Boolean) as Asset[];
  const hashtags = useMemo(() => normalizeHashtags(tags), [tags]);
  const checks = active.map((p) => ({ p, media: mediaProblem(p, formats[p], chosen), caption: checkCaption(p, caption, hashtags) }));
  const blocking = checks.some((c) => c.media || !c.caption.ok) || !active.length || !chosen.length;

  const toggleAsset = (aid: string) => setSelected((s) => (s.includes(aid) ? s.filter((x) => x !== aid) : s.length >= 10 ? s : [...s, aid]));

  function submit(mode: "draft" | "schedule" | "now") {
    setResult(null);
    if (mode === "schedule" && !when) { setResult({ ok: false, text: "Pick a date and time first." }); return; }
    start(async () => {
      const r = await savePost({
        id: initial?.id, targets: active.map((p) => ({ platform: p, format: formats[p] })), caption, hashtags: hashtags.join(" "),
        assetIds: selected, scheduledAt: when ? new Date(when).toISOString() : null, mode,
      });
      setResult({ ok: r.ok, text: r.ok ? r.message ?? "Saved." : r.error ?? "Something went wrong." });
      if (r.ok && !initial) { setSelected([]); setCaption(""); setTags(""); setWhen(""); setDrafts([]); }
      router.refresh();
    });
  }

  function askAssistant() {
    setAiNote("");
    startAi(async () => {
      const r = await draftAction({ brief, goal, tone, platform: active[0] ?? "instagram", audiences, language });
      if ("error" in r) { setAiNote(r.error); setDrafts([]); return; }
      setDrafts(r.drafts);
      setAiNote(r.note ?? (r.source === "templates" ? "Built-in templates (no AI key set, or AI is switched off)." : `Written by ${r.source === "gemini" ? "Gemini" : "Claude"}. Check facts before posting.`));
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <fieldset className="card space-y-4">
          <legend className="sr-only">Where to post</legend>
          <h2 className="text-lg font-bold">1. Where</h2>
          {(["instagram", "tiktok"] as Platform[]).map((p) => (
            <div key={p} className="flex flex-wrap items-center gap-3">
              <label className="flex min-w-32 items-center gap-2 font-semibold">
                <input type="checkbox" className="h-5 w-5 accent-[var(--lime)]" checked={platforms[p]} disabled={Boolean(initial)}
                  onChange={(e) => setPlatforms((s) => ({ ...s, [p]: e.target.checked }))} />
                {p === "instagram" ? "Instagram" : "TikTok"}
              </label>
              <label className="sr-only" htmlFor={`${id}-${p}-fmt`}>{p} format</label>
              <select id={`${id}-${p}-fmt`} className="input w-auto" value={formats[p]} disabled={!platforms[p]}
                onChange={(e) => setFormats((s) => ({ ...s, [p]: e.target.value as Format }))}>
                {FORMATS[p].map((f) => <option key={f.value} value={f.value}>{f.label} ({f.hint})</option>)}
              </select>
              {p === "instagram" && platforms.instagram && !igConnected && <span className="text-sm text-warn">Not connected yet: drafts only. <a className="underline" href="/studio/accounts">Connect</a></span>}
              {p === "tiktok" && platforms.tiktok && <span className="text-sm text-muted">Prepared for you to post (see Setup).</span>}
            </div>
          ))}
        </fieldset>

        <fieldset className="card">
          <legend className="sr-only">Media</legend>
          <h2 className="mb-1 text-lg font-bold">2. Media</h2>
          <p className="help mb-3">Click to select, in posting order (up to 10). <a href="/studio/library" className="underline">Upload more</a></p>
          {assets.length === 0 ? <p className="text-sm">Your library is empty. <a href="/studio/library" className="underline">Upload media first.</a></p> : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {assets.map((a) => {
                const n = selected.indexOf(a.id);
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => toggleAsset(a.id)} aria-pressed={n >= 0}
                      className={`relative block w-full rounded-xl border-2 p-1 text-left ${n >= 0 ? "border-lime" : "border-transparent"}`}>
                      <Thumb url={a.url} kind={a.kind} label={a.label} className="aspect-square w-full" />
                      {n >= 0 && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-lime text-xs font-bold text-lime-ink">{n + 1}</span>}
                      <span className="mt-1 block truncate text-xs text-muted">{a.kind === "video" ? "Video · " : a.mime === "image/png" ? "PNG · " : ""}{a.label ?? "Untitled"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        <fieldset className="card space-y-4">
          <legend className="sr-only">Caption</legend>
          <h2 className="text-lg font-bold">3. Caption</h2>
          <div>
            <label htmlFor={`${id}-cap`} className="label">Caption</label>
            <textarea id={`${id}-cap`} value={caption} onChange={(e) => setCaption(e.target.value)} rows={7} maxLength={2200} className="input" />
          </div>
          <div>
            <label htmlFor={`${id}-tags`} className="label">Hashtags</label>
            <input id={`${id}-tags`} value={tags} onChange={(e) => setTags(e.target.value)} className="input" placeholder="#freelancer #smallbusiness" aria-describedby={`${id}-tags-help`} />
            <p id={`${id}-tags-help`} className="help">Instagram allows at most 5 hashtags per post (caption included). 3–5 specific tags beat many broad ones.</p>
          </div>
          <ul className="space-y-1 text-sm" aria-live="polite">
            {checks.map((c) => (
              <li key={c.p} className={c.media || !c.caption.ok ? "text-bad" : "text-good"}>
                <strong>{c.p === "instagram" ? "Instagram" : "TikTok"}:</strong>{" "}
                {c.media ?? (c.caption.ok ? `ready (${c.caption.length} characters, ${c.caption.tagCount} hashtags)` : c.caption.problems.join(" "))}
              </li>
            ))}
          </ul>
          {caption && <details><summary className="cursor-pointer text-sm font-semibold">Preview the final text</summary><pre className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm">{composeCaption(caption, hashtags)}</pre></details>}
        </fieldset>

        <fieldset className="card space-y-4">
          <legend className="sr-only">When</legend>
          <h2 className="text-lg font-bold">4. When</h2>
          <div>
            <label htmlFor={`${id}-when`} className="label">Date and time (your local time)</label>
            <input id={`${id}-when`} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="input w-auto" />
            <p className="help">Scheduled posts are checked every 5 minutes, so they go out within about 5 minutes of this time.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={pending || blocking} onClick={() => submit("schedule")}>Schedule</button>
            <button type="button" className="btn-ghost" disabled={pending || blocking} onClick={() => submit("now")}>Publish now</button>
            <button type="button" className="btn-ghost" disabled={pending || !active.length || !chosen.length} onClick={() => submit("draft")}>Save draft</button>
          </div>
          {pending && <p role="status" className="text-sm">Working… publishing a video can take up to a minute.</p>}
          {result && <p role={result.ok ? "status" : "alert"} className={`text-sm font-semibold ${result.ok ? "text-good" : "text-bad"}`}>{result.text}</p>}
        </fieldset>
      </div>

      <aside className="card h-fit space-y-4 lg:sticky lg:top-4" aria-labelledby={`${id}-ai`}>
        <div>
          <h2 id={`${id}-ai`} className="text-lg font-bold">Assistant</h2>
          <p className="help">{providerLabel}. Don't put private customer details in the brief.</p>
        </div>
        <div>
          <label htmlFor={`${id}-brief`} className="label">What's the post about?</label>
          <textarea id={`${id}-brief`} value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} maxLength={1500} className="input" placeholder="e.g. QuoteRevive reminds you when to follow up on quotes. FIRST6 = 50% off for the first 6 customers, ends Nov 18." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor={`${id}-goal`} className="label">Goal</label>
            <select id={`${id}-goal`} className="input" value={goal} onChange={(e) => setGoal(e.target.value as GoalKey)}>{Object.entries(GOALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label htmlFor={`${id}-tone`} className="label">Tone</label>
            <select id={`${id}-tone`} className="input" value={tone} onChange={(e) => setTone(e.target.value as ToneKey)}>{Object.entries(TONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
        <div><label htmlFor={`${id}-lang`} className="label">Language</label>
          <select id={`${id}-lang`} className="input" value={language} onChange={(e) => setLanguage(e.target.value as (typeof LANGS)[number])}>{LANGS.map((l) => <option key={l}>{l}</option>)}</select></div>
        <fieldset>
          <legend className="label">Audience</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(AUDIENCES) as AudienceKey[]).map((k) => (
              <label key={k} className={`pill cursor-pointer gap-1.5 py-1.5 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[var(--focus)] ${audiences.includes(k) ? "border-lime bg-lime text-lime-ink" : ""}`}>
                <input type="checkbox" className="sr-only" checked={audiences.includes(k)} onChange={(e) => setAudiences((s) => (e.target.checked ? [...s, k] : s.filter((x) => x !== k)))} />
                {AUDIENCES[k].label}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="button" className="btn-primary w-full" onClick={askAssistant} disabled={aiPending}>{aiPending ? "Writing…" : "Write 3 captions"}</button>
        {aiNote && <p role="status" className="text-sm text-muted">{aiNote}</p>}
        <ol className="space-y-3">
          {drafts.map((d, i) => (
            <li key={i} className="rounded-xl border border-line p-3">
              <p className="whitespace-pre-wrap text-sm">{d.caption}</p>
              <p className="mt-2 text-sm text-accent">{d.hashtags.map((h) => `#${h}`).join(" ")}</p>
              <button type="button" className="btn-ghost mt-2 min-h-9 px-4" onClick={() => { setCaption(d.caption); setTags(d.hashtags.map((h) => `#${h}`).join(" ")); }}>
                Use option {i + 1}
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
