import Link from "next/link";
export const metadata = { title: "How to use QuoteRevive", description: "Step-by-step guide: add quotes, follow up from today's queue, record replies and read your dashboard." };

const STEPS: { h: string; items: React.ReactNode[] }[] = [
  { h: "1. Create your account (2 minutes)", items: [
    <>Go to <Link href="/signup">Sign up</Link>, enter your email and a password (10+ characters) and tick the Terms box.</>,
    "Open the confirmation email and tap the button. If the page says the link didn't work, just sign in — your email is usually confirmed already.",
    "Answer the five setup questions: business name, industry, currency, typical quote value and how you usually follow up. You can skip and finish later.",
  ]},
  { h: "2. Add the quotes you've sent", items: [
    <>Tap <strong>Add a quote</strong>. Only the customer name, job, amount and currency are required.</>,
    "Add the customer's WhatsApp number with country code (e.g. +251…) or email if you want one-tap messages.",
    "Set the date you sent it. Leave “Next follow-up” blank and QuoteRevive suggests one (3 days after sending by default).",
    <>Have a spreadsheet? Use <strong>Import</strong>: download the sample CSV, match your columns, fix any rows listed in red, then import. Importing never overwrites existing quotes.</>,
  ]},
  { h: "3. Every morning: open Today", items: [
    <><strong>Today</strong> lists only the quotes whose follow-up date has arrived, highest priority first.</>,
    "The score is a sum of visible reasons — overdue, expiring soon, waiting a long time, above your usual value, never followed up. It ranks urgency; it does not predict whether someone will buy.",
  ]},
  { h: "4. Send a follow-up in under a minute", items: [
    "Tap a quote. Pick a tone: Friendly, Professional, Concise or Final check-in.",
    "Edit the message if you like, then tap Copy message, Open WhatsApp or Open email draft.",
    <>Send it from your own app. QuoteRevive never sends anything for you.</>,
    <>Back in QuoteRevive tap <strong>I sent this follow-up</strong>. The quote moves to “Awaiting response” and the next follow-up is scheduled automatically (or pick a date).</>,
  ]},
  { h: "5. When the customer replies", items: [
    <>Tap <strong>Record customer response</strong>, add a short note and choose: Negotiating, Still deciding, Accepted or Rejected.</>,
    "If they accepted and you think the follow-up helped, tick the box. That's your judgement — the dashboard labels it that way.",
    <>If someone asks you to stop contacting them, tap <strong>Customer asked not to be contacted</strong>. QuoteRevive stops suggesting follow-ups for that quote.</>,
    "After 3 unanswered follow-ups (you can change this) QuoteRevive stops suggesting more, so you never over-message.",
  ]},
  { h: "6. Read your dashboard", items: [
    "Outstanding quote value = open quotes still waiting. It is not money earned.",
    "Accepted quote value = quotes you marked accepted.",
    "Customer silence shows how long open quotes have been waiting, so you can send final check-ins or mark old ones expired.",
    "Totals use your main currency; quotes in other currencies are counted but not added together.",
  ]},
  { h: "7. Settings, your data and upgrading", items: [
    <><strong>Settings</strong>: change follow-up timing, profile photo, email or password; export everything (CSV/JSON); or delete your account.</>,
    <>The free workspace holds 10 quotes. To add more, open <strong>Access</strong>, buy Founding Access ($39 one-time on Whop), then paste your Whop membership ID (starts with mem_) to unlock it.</>,
    <>Need help? See <Link href="/contact">Contact & support</Link>.</>,
  ]},
];

export default function Guide() {
  return (
    <article className="prose-legal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">How to use QuoteRevive</h1>
      <p className="text-muted">Seven short steps. Want to try first? Open the <Link href="/demo">demo</Link> — it uses made-up data and nothing is saved.</p>
      {STEPS.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          <ol>{s.items.map((it, i) => <li key={i}>{it}</li>)}</ol>
        </section>
      ))}
    </article>
  );
}
