import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { PRICE } from "@/lib/offer";
export const metadata = { title: "Terms & Conditions" };
export default function Terms() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>These terms are an agreement between you and Scalify Web Production &amp; Development ([REGISTERED ADDRESS]) for use of QuoteRevive. By creating an account you agree to them.</p>
      <h2>1. The service</h2>
      <p>QuoteRevive helps you record quotes, plan follow-ups and prepare messages. It does <strong>not</strong> send messages to your customers, does not integrate with or automate WhatsApp, Instagram or email, and does not guarantee any sale, reply or revenue. The priority score and suggestions are simple rules to help you organise your work, not predictions.</p>
      <h2>2. Accounts</h2>
      <p>You must be at least 18 and using QuoteRevive for business purposes. Keep your password secure; you are responsible for activity on your account. One account is for one business and one user.</p>
      <h2>3. Your data and your customers</h2>
      <p>You keep all rights to the content you enter. You give us permission to host and process it only to run the service. You confirm you have a lawful basis to store your customers&apos; details and to share a quote link with them (anyone holding the link can view that quote, so only send it to the intended customer), will only contact customers in line with applicable law (including anti-spam and consumer-protection rules and the terms of the messaging apps you use), and will respect customers who ask not to be contacted. See the <Link href="/legal/privacy">Privacy Policy</Link>.</p>
      <h2>4. Acceptable use</h2>
      <ul><li>No unlawful, harassing, deceptive or spam messaging.</li><li>No attempts to access others&apos; data, probe, overload or reverse-engineer the service.</li><li>No storing special-category data (health, religion, etc.), payment card numbers or government IDs in notes.</li><li>No reselling access without our written permission.</li></ul>
      <h2>5. Free workspace and Founding Access</h2>
      <p>{PRICE.free} {PRICE.name} costs {PRICE.display}, paid through Whop. {PRICE.summary} {PRICE.term} {PRICE.allowance} We may add new features, which may be offered separately; we will not remove core MVP features (quotes, daily queue, follow-up assistant, timeline, dashboard, CSV import/export) from Founding Access during the term above. Refunds are covered by the <Link href="/legal/refund">Refund Policy</Link>. If a payment is refunded or reversed, Founding Access ends and the workspace returns to the free limit (your data is kept, but you can&apos;t add quotes beyond the free limit).</p>
      <h2>6. Availability</h2>
      <p>We aim for reliable service but do not promise it will be uninterrupted or error-free. Keep your own copies of important records using the export feature.</p>
      <h2>7. Intellectual property</h2>
      <p>The QuoteRevive software, name, logo and design belong to Scalify Web Production &amp; Development. Open-source components are used under their licences.</p>
      <h2>8. Disclaimers and liability</h2>
      <p>To the extent permitted by law, the service is provided &quot;as is&quot; and our total liability for any claim is limited to the amount you paid us in the 12 months before the claim. We are not liable for lost profits, lost sales or indirect losses. Nothing in these terms limits liability that cannot legally be limited, or your statutory rights as a consumer where those apply. [Lawyer: enforceability varies by jurisdiction.]</p>
      <h2>9. Termination</h2>
      <p>You may delete your account at any time in Settings. We may suspend or end accounts that break these terms, with notice where reasonable. If we discontinue the service we will give at least 60 days&apos; notice so you can export your data.</p>
      <h2>10. Changes</h2>
      <p>We may update these terms; we&apos;ll give notice of material changes by email or in the app at least 14 days before they apply.</p>
      <h2>11. Governing law</h2>
      <p>These terms are governed by the laws of [JURISDICTION], and disputes go to the courts of [VENUE], without removing any mandatory consumer protections of your country of residence.</p>
      <h2>12. Contact</h2>
      <p><a href="mailto:scalifywpd@gmail.com">scalifywpd@gmail.com</a> · Scalify Web Production &amp; Development, [REGISTERED ADDRESS]</p>
      <p className="text-sm">WhatsApp and Instagram are trademarks of Meta Platforms, Inc. Whop is a trademark of its owner. QuoteRevive is not affiliated with or endorsed by them.</p>
    </LegalPage>
  );
}
