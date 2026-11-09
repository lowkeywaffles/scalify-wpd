import Link from "next/link";
import { BellRing, CalendarClock, ClipboardCopy, FileSpreadsheet, Gauge, History, LineChart, ShieldCheck } from "lucide-react";
import { DemoWorkspace } from "@/components/DemoWorkspace";
import { PRICE } from "@/lib/offer";

const STEPS = [
  { t: "Log the quotes you've sent", b: "Add them one by one in seconds, or import a spreadsheet. Old, forgotten quotes count too." },
  { t: "See who to follow up with today", b: "A daily queue ranks quotes by urgency — age, expiry, value and past contact — and shows why." },
  { t: "Send a personal follow-up from your own app", b: "Pick a tone, edit the message, then copy it or open WhatsApp or email. You press send." },
  { t: "Record what happened", b: "Mark it sent, log the reply, and QuoteRevive schedules the next step — or stops reminding you." },
];
const FEATURES = [
  { i: CalendarClock, t: "Daily recovery queue", b: "One screen with exactly the quotes that need attention today." },
  { i: Gauge, t: "Explainable priority score", b: "Every point traces to a visible reason. It ranks urgency — it doesn't predict buying." },
  { i: ClipboardCopy, t: "Follow-up assistant", b: "Friendly, professional, concise or final check-in messages, prefilled from the quote." },
  { i: History, t: "Follow-up timeline", b: "Every message, reply and status change on one clear history." },
  { i: LineChart, t: "Honest dashboard", b: "Outstanding value is kept separate from accepted value. Estimates are never shown as revenue." },
  { i: BellRing, t: "Sensible reminders", b: "In-app reminders that stop after your chosen number of unanswered follow-ups." },
  { i: FileSpreadsheet, t: "CSV import & export", b: "Preview, map columns and see row-level errors. Your data leaves with you any time." },
  { i: ShieldCheck, t: "Private by design", b: "No ads, no trackers, no selling data. Each business only ever sees its own records." },
];
const WHO = ["Freelancers & creative agencies", "Printing & signage", "Custom furniture & interiors", "Repair & maintenance", "Event services", "Small contractors"];
const FAQ = [
  { q: "Does QuoteRevive send messages for me?", a: "No. It prepares the message and opens WhatsApp or your email app with it filled in. You review and send it yourself. Opening the app does not count as sending — you mark it sent when you actually have." },
  { q: "Do I need to connect WhatsApp, Instagram or my email?", a: "No. There are no integrations to set up and no automated messaging, which also keeps you within those platforms' rules." },
  { q: "Is the $39 a subscription?", a: `No. ${PRICE.summary}` },
  { q: "How long does Founding Access last?", a: PRICE.term },
  { q: "What's included?", a: `All current features: quotes, daily queue, follow-up assistant, timeline, dashboard, reminders and CSV import/export. ${PRICE.allowance}` },
  { q: "Can I try it first?", a: `Yes. Explore the demo with no sign-up, or create a free workspace. ${PRICE.free}` },
  { q: "Can I get a refund?", a: "Yes — see the Refund Policy for the window and how to ask." },
  { q: "Which currencies work?", a: "Any 3-letter currency code (USD, EUR, GBP, ETB, KES and so on). Totals are calculated per currency and never mixed." },
  { q: "Is there AI in it?", a: "Not currently. Messages come from clear templates so results are predictable and free." },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
        <div className="max-w-3xl rise">
          <p className="mb-4 text-sm font-semibold text-accent">Quote follow-up for small businesses</p>
          <h1 className="font-display text-5xl leading-[1.02] sm:text-7xl">Your next customer might be in your <em className="text-accent">unanswered quotes.</em></h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">Track quotations, follow up at the right time, and recover opportunities before they disappear.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary h-12 px-6 text-base">Start recovering quotes</Link>
            <Link href="#how" className="btn btn-ghost h-12 px-6 text-base">See how it works</Link>
          </div>
          <p className="mt-3 text-sm text-muted">Free workspace for up to 10 quotes · no card needed</p>
        </div>
        <div className="mt-12 rise" style={{ animationDelay: "120ms" }} aria-label="Interactive product preview with fictional data" role="region">
          <DemoWorkspace compact />
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16" aria-labelledby="problem">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
          <h2 id="problem" className="font-display text-4xl sm:text-5xl">You sent the quote. They never replied. Did you ever follow up?</h2>
          <ul className="space-y-4 text-lg">
            <li>Quotes go out over WhatsApp, email and Instagram — and get buried.</li>
            <li>It feels awkward to chase, so it doesn&apos;t happen.</li>
            <li>There&apos;s no simple list of which quotes are still alive.</li>
            <li>A full CRM is far more than you need.</li>
          </ul>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20" aria-labelledby="how-h">
        <h2 id="how-h" className="font-display text-4xl sm:text-5xl">How QuoteRevive works</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="card p-5">
              <span className="font-display text-4xl text-accent" aria-hidden="true">0{i + 1}</span>
              <h3 className="mt-3 font-semibold">{s.t}</h3><p className="mt-2 text-sm text-muted">{s.b}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8"><Link className="btn btn-ghost" href="/demo">Try the full interactive demo</Link></p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="feat">
        <h2 id="feat" className="font-display text-4xl sm:text-5xl">Focused on one job</h2>
        <p className="mt-3 max-w-2xl text-muted">Not another CRM. Just the tools to turn sent quotes into confirmed work.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (<li key={f.t} className="card p-5"><f.i className="h-6 w-6 text-accent" aria-hidden="true" /><h3 className="mt-3 font-semibold">{f.t}</h3><p className="mt-1 text-sm text-muted">{f.b}</p></li>))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="who">
        <h2 id="who" className="font-display text-4xl">Built for businesses that quote</h2>
        <ul className="mt-6 flex flex-wrap gap-2">{WHO.map((w) => <li key={w} className="rounded-full border border-line bg-surface px-4 py-2">{w}</li>)}</ul>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20" aria-labelledby="price-h">
        <h2 id="price-h" className="font-display text-4xl sm:text-5xl">Simple pricing</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Free workspace</h3>
            <p className="mt-2 font-display text-5xl">$0</p>
            <p className="mt-3 text-sm text-muted">{PRICE.free}</p>
            <Link href="/signup" className="btn btn-ghost mt-6">Create free account</Link>
          </div>
          <div className="card p-6 ring-2 ring-accent">
            <h3 className="text-lg font-semibold">{PRICE.name}</h3>
            <p className="mt-2 font-display text-5xl">$39 <span className="text-lg text-muted">USD one-time</span></p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
              <li>{PRICE.allowance}</li><li>All current features listed above</li><li>No subscription, no automatic renewal</li>
            </ul>
            <p className="mt-4 text-xs text-muted">{PRICE.summary} {PRICE.term} See the <Link className="link" href="/legal/refund">Refund Policy</Link>.</p>
            <Link href="/signup" className="btn btn-primary mt-6">Start free, upgrade inside the app</Link>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">Not included yet: email reminders, quote file attachments, team members, AI-written messages.</p>
      </section>

      <section id="security" className="border-y border-line bg-surface py-16" aria-labelledby="sec-h">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <h2 id="sec-h" className="font-display text-4xl">Your customers&apos; details stay yours</h2>
          <ul className="space-y-3">
            <li>Each business&apos;s data is isolated in the database with row-level security.</li>
            <li>No advertising, analytics trackers or third-party scripts on any page.</li>
            <li>Only an essential sign-in cookie, plus an optional theme cookie if you switch theme.</li>
            <li>Export everything to CSV/JSON, or delete your account and data, from Settings.</li>
            <li>We never message your customers and never sell or share data for marketing.</li>
          </ul>
          <p className="text-sm text-muted md:col-start-2">No system is perfectly secure; read the <Link className="link" href="/legal/privacy">Privacy Policy</Link> for exactly what we store and why.</p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20" aria-labelledby="faq-h">
        <h2 id="faq-h" className="font-display text-4xl sm:text-5xl">Questions</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (<details key={f.q} className="group py-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-muted">{f.a}</p></details>))}
        </div>
        <p className="mt-8">Still wondering? <Link className="link" href="/contact">Contact support</Link>.</p>
      </section>
    </>
  );
}
