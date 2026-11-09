import { loadWorkspace } from "@/lib/data";
import { publicEnv } from "@/lib/env";
import { LinkWhopForm } from "@/components/LinkWhopForm";
import { PRICE } from "@/lib/offer";

export const metadata = { title: "Access" };

export default async function Billing() {
  const { paid, quotes } = await loadWorkspace();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-4xl">Access</h1>
      {paid ? (
        <div className="card p-6"><p className="font-semibold text-good">Founding Access is active.</p><p className="mt-2 text-sm text-muted">{PRICE.allowance}</p></div>
      ) : (
        <div className="card space-y-4 p-6">
          <p>You&apos;re on the free trial workspace: up to 10 quotes ({quotes.length} used).</p>
          <h2 className="font-display text-2xl">{PRICE.name} — {PRICE.display}</h2>
          <p className="text-sm text-muted">{PRICE.summary}</p>
          {publicEnv.whopCheckoutUrl ? <a className="btn btn-primary" href={publicEnv.whopCheckoutUrl} target="_blank" rel="noopener noreferrer">Buy on Whop<span className="sr-only"> (opens in a new tab)</span></a> : <p className="text-sm">Checkout isn&apos;t open yet. Email {publicEnv.supportEmail} for early access.</p>}
          <h3 className="font-semibold">Already bought? Link your purchase</h3>
          <p className="text-sm text-muted">Find your membership ID (starts with <code>mem_</code>) in your Whop account under the QuoteRevive purchase. We check it with Whop before unlocking anything.</p>
          <LinkWhopForm />
        </div>
      )}
    </div>
  );
}
