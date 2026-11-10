"use client";
import { CheckCircle2, Clock, MessageCircleQuestion } from "lucide-react";
import { useActionState, useState } from "react";
import { respondToQuote, type RespondState } from "@/app/q/actions";
import { Notice } from "./ui";

const OPTIONS = [
  { v: "accept", label: "Accept quote", icon: CheckCircle2, hint: "Let them know you'd like to go ahead." },
  { v: "question", label: "Ask a question", icon: MessageCircleQuestion, hint: "Ask about price, scope or timing." },
  { v: "not_now", label: "Not right now", icon: Clock, hint: "No pressure — they'll check back in about a month." },
] as const;

export function QuoteResponseForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<RespondState, FormData>(respondToQuote, {});
  const [choice, setChoice] = useState<string>("");
  if (state.ok) {
    const done = { accept: "Thank you! Your acceptance has been sent.", question: "Thanks — your question has been sent.", not_now: "Thanks for letting them know." }[state.choice ?? "accept"];
    return <div className="card rise p-6 text-center" role="status"><CheckCircle2 className="mx-auto h-10 w-10 text-good" aria-hidden="true" /><p className="mt-3 text-lg font-semibold">{done}</p><p className="mt-1 text-sm text-muted">The business will get back to you.</p></div>;
  }
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="token" value={token} />
      <fieldset>
        <legend className="mb-3 font-semibold">How would you like to respond?</legend>
        <div className="grid gap-2">
          {OPTIONS.map((o) => (
            <label key={o.v} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)] ${choice === o.v ? "border-accent bg-accent-soft" : "border-line hover:border-muted"}`}>
              <input type="radio" name="choice" value={o.v} className="sr-only" checked={choice === o.v} onChange={() => setChoice(o.v)} />
              <o.icon className={`mt-0.5 h-5 w-5 shrink-0 ${choice === o.v ? "text-accent" : "text-muted"}`} aria-hidden="true" />
              <span><span className="block font-semibold">{o.label}</span><span className="text-sm text-muted">{o.hint}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      {choice && (
        <div>
          <label htmlFor="qr-msg" className="label">{choice === "question" ? "Your question" : "Message"} {choice !== "question" && <span className="font-normal text-muted">(optional)</span>}</label>
          <textarea id="qr-msg" name="message" className="input min-h-24" maxLength={500} dir="auto" />
          <p className="hint mt-1">Please don&apos;t include payment card details.</p>
        </div>
      )}
      <button className="btn btn-primary w-full" disabled={!choice || pending}>{pending ? "Sending…" : "Send response"}</button>
      <div aria-live="polite">{state.error && <Notice kind="error">{state.error}</Notice>}</div>
    </form>
  );
}
