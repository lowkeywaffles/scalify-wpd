import Link from "next/link";
import { DemoWorkspace } from "@/components/DemoWorkspace";
export const metadata = { title: "Interactive demo", description: "Explore QuoteRevive with a fictional demo workspace — no sign-up." };
export default function Demo() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <h1 className="font-display text-5xl">Try QuoteRevive</h1>
      <p className="max-w-2xl text-muted">Every customer, business and amount here is fictional. Pick a quote in today&apos;s queue, prepare a follow-up, then record it. Nothing is saved or sent, and refreshing resets the demo.</p>
      <DemoWorkspace />
      <Link href="/signup" className="btn btn-primary">Start your own free workspace</Link>
    </div>
  );
}
