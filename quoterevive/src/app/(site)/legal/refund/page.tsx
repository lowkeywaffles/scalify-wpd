import { LegalPage } from "@/components/LegalPage";
import { PRICE } from "@/lib/offer";
export const metadata = { title: "Refund Policy" };
export default function Refund() {
  return (
    <LegalPage title="Refund Policy">
      <h2>What you pay</h2>
      <p>{PRICE.name}: {PRICE.display}. {PRICE.summary} There are no hidden fees, add-ons or renewals.</p>
      <h2>14-day refund</h2>
      <p>If you&apos;re not happy, ask for a full refund within <strong>14 days</strong> of purchase — no reason needed. This also covers the EU/UK 14-day right of withdrawal for consumers.</p>
      <h2>How to ask</h2>
      <p>Request it through your Whop purchase page, or email [SUPPORT EMAIL] with the email you bought with. We aim to approve within 3 business days. Whop returns the money to your original payment method; how long it takes to appear depends on your bank or card provider [VERIFY typical Whop timelines]. We do not charge a fee for refunds. [VERIFY whether Whop retains any processing fee on refunded payments — if so, we absorb it.]</p>
      <h2>After 14 days</h2>
      <p>Refunds after 14 days are at our discretion, except where the law gives you a right to one (for example if the service is faulty or not as described).</p>
      <h2>What happens to your account</h2>
      <p>When a refund is processed, Founding Access ends automatically and your workspace returns to the free limit of 10 quotes. Your data is not deleted — you can export it or delete your account at any time.</p>
      <h2>Free workspace</h2>
      <p>The free workspace costs nothing, so there&apos;s nothing to cancel. Deleting your account doesn&apos;t cancel or refund a purchase by itself — ask for a refund first if you want one.</p>
    </LegalPage>
  );
}
