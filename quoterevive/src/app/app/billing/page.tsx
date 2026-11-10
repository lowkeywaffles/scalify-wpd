import { loadWorkspace } from "@/lib/data";
import { whopConfigured } from "@/lib/whop";
import { LinkWhopForm } from "@/components/LinkWhopForm";
import { Notice } from "@/components/ui";
import { PRICE } from "@/lib/offer";
import { startCheckout } from "../actions";

export const metadata = { title: "Access" };

const MESSAGES: Record<string, { kind: "info" | "error"; text: string }> = {
  done: { kind: "info", text: "Thanks! Whop is confirming your payment — this usually takes under a minute. Refresh this page to see Founding Access activate." },
  error: { kind: "error", text: "We couldn't open checkout just now. Please try again in a few minutes." },
  unavailable: { kind: "error", text: "Checkout isn't open yet. Please check back soon." },
  busy: { kind: "error", text: "Too many checkout attempts. Please wait a bit and try again." },
};

export default async function Billing({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { paid, quotes } = await loadWorkspace();
  const msg = MESSAGES[(await searchParams).checkout ?? ""];
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-4xl">Access</h1>
      {msg && !paid && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {paid ? (
        <div className="card p-6"><p className="font-semibold text-good">Founding Access is active.</p><p className="mt-2 text-sm text-muted">{PRICE.allowance}</p></div>
      ) : (
        <div className="card space-y-4 p-6">
          <p>You&apos;re on the free workspace: up to 10 quotes ({quotes.length} used).</p>
          <h2 className="font-display text-2xl">{PRICE.name} — {PRICE.display}</h2>
          <p className="text-sm text-muted">{PRICE.summary}</p>
          <p className="text-sm text-muted">{PRICE.term}</p>
          {whopConfigured() ? (
            <form action={startCheckout}>
              <button className="btn btn-primary">Buy Founding Access — $39 one-time</button>
              <p className="hint mt-2">You&apos;ll pay securely on Whop. Whop may show the price in your local currency and adds any tax before you pay. Access unlocks automatically on this account. 14-day refund.</p>
            </form>
          ) : <p className="text-sm">Checkout isn&apos;t open yet. Please check back soon.</p>}
          <details className="border-t border-line pt-4">
            <summary className="cursor-pointer text-sm font-semibold">Bought on Whop directly? Link your purchase</summary>
            <p className="mt-2 text-sm text-muted">Paste your Whop membership ID (starts with <code>mem_</code>). We check it with Whop before unlocking anything.</p>
            <div className="mt-3"><LinkWhopForm /></div>
          </details>
        </div>
      )}
    </div>
  );
}
