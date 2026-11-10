"use client";
import { CheckCircle2, FilePlus2, MessageCircle, Pause, Play, Timer } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = [
  { icon: FilePlus2, title: "Log the quote", body: "Customer, job, amount. Ten seconds." },
  { icon: Timer, title: "It surfaces on time", body: "Today's queue shows it when a follow-up is due." },
  { icon: MessageCircle, title: "Send a personal nudge", body: "Pick a tone, open WhatsApp, press send yourself." },
  { icon: CheckCircle2, title: "Record the yes", body: "Mark it accepted — your dashboard updates." },
];

/** Decorative 3D walkthrough (fictional data). Auto-advances with a pause control; static for reduced-motion users. */
export function MotionStage() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), 3200);
    return () => clearTimeout(t);
  }, [playing, step]);

  return (
    <section aria-labelledby="motion-h" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent">See it in motion</p>
          <h2 id="motion-h" className="font-display text-4xl sm:text-5xl">From forgotten quote to “yes” in four moves</h2>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
          {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? "Pause animation" : "Play animation"}
        </button>
      </div>
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button type="button" onClick={() => { setStep(i); setPlaying(false); }} aria-current={step === i ? "step" : undefined}
                className={`card card-hover flex w-full items-start gap-4 p-4 text-left ${step === i ? "glow-ring" : ""}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${step === i ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}><s.icon className="h-5 w-5" aria-hidden="true" /></span>
                <span><span className="block font-semibold">{i + 1}. {s.title}</span><span className="text-sm text-muted">{s.body}</span></span>
                {step === i && playing && <span aria-hidden="true" className="ml-auto mt-1 h-1 w-10 overflow-hidden rounded-full bg-line"><span className="block h-full animate-[grow_3.2s_linear] bg-accent" /></span>}
              </button>
            </li>
          ))}
        </ol>

        <div className="stage3d relative mx-auto aspect-[4/3] w-full max-w-xl" aria-hidden="true" data-step={step}>
          <div className="stage3d-floor" />
          <div className="stage3d-scene">
            {/* Quote card */}
            <div className="s3-card s3-quote">
              <div className="flex items-center justify-between"><span className="text-xs text-muted">Quote · fictional</span><span className={`s3-badge ${step >= 3 ? "s3-badge-good" : step >= 1 ? "s3-badge-due" : ""}`}>{step >= 3 ? "Accepted" : step >= 1 ? "Follow-up due" : "Sent"}</span></div>
              <p className="mt-2 font-semibold">Maya R. — shop sign</p>
              <p className="font-display text-3xl">$1,150</p>
              <div className="mt-3 h-1.5 rounded-full bg-line"><div className="s3-progress h-full rounded-full" /></div>
            </div>
            {/* Score ring */}
            <div className="s3-card s3-score">
              <svg viewBox="0 0 44 44" className="h-14 w-14 -rotate-90"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--line)" strokeWidth="5" /><circle cx="22" cy="22" r="18" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray="113" className="s3-ring" /></svg>
              <div><p className="text-xs text-muted">Priority</p><p className="font-display text-2xl">72</p></div>
            </div>
            {/* Message bubble */}
            <div className="s3-card s3-msg">
              <p className="text-xs text-muted">WhatsApp draft</p>
              <p className="mt-1 text-sm">Hey Maya, just checking in about the shop sign quotation I sent last week…</p>
              <span className="s3-send">Send ➜</span>
            </div>
            {/* Win */}
            <div className="s3-card s3-win"><CheckCircle2 className="h-6 w-6 text-good" /><p className="font-semibold">Quote won!</p></div>
            {step === 3 && <div className="s3-spark">{Array.from({ length: 14 }, (_, i) => <span key={i} style={{ transform: `rotate(${i * 26}deg) translateY(-70px)`, animationDelay: `${i * 30}ms` }} />)}</div>}
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">Step {step + 1} of 4: {STEPS[step].title}. {STEPS[step].body}</p>
    </section>
  );
}
