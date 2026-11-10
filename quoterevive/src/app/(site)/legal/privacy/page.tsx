import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
export const metadata = { title: "Privacy Policy" };
export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>Who we are</h2>
      <p>QuoteRevive is operated by [LEGAL BUSINESS NAME], [REGISTERED ADDRESS], [REGISTRATION NUMBER, if any] (&quot;we&quot;). Contact: [PRIVACY EMAIL]. [If required: EU/UK representative or Data Protection Officer details.]</p>

      <h2>Two kinds of personal data</h2>
      <p><strong>Your account data</strong> — we are the controller. <strong>Your customers&apos; data</strong> that you enter into QuoteRevive (names, contact details, quote details) — you are the controller and we process it only on your instructions to provide the service (we act as your processor). You are responsible for having a lawful reason to store your customers&apos; details and for honouring their requests; use the &quot;customer asked not to be contacted&quot; option and delete records you no longer need. [Lawyer: consider a Data Processing Addendum for business customers.]</p>

      <h2>What we collect, why, and our legal basis</h2>
      <table><thead><tr><th>Data</th><th>Purpose</th><th>Legal basis (GDPR/UK GDPR)</th><th>Retention</th></tr></thead><tbody>
        <tr><td>Email address, password (stored hashed by Supabase Auth)</td><td>Create and secure your account, send sign-in, confirmation and password-reset emails</td><td>Contract</td><td>Until you delete your account</td></tr>
        <tr><td>Terms acceptance timestamp and version</td><td>Record that you agreed to the Terms</td><td>Legitimate interests / legal obligation</td><td>Life of account</td></tr>
        <tr><td>Business profile: business name, industry, currency, typical quote value, preferred channel, follow-up settings, optional display name and optional profile photo (resized to 160 px on your device)</td><td>Configure your workspace and follow-up suggestions</td><td>Contract</td><td>Until you change or delete it</td></tr>
        <tr><td>Quotes, customer names and optional contact details, notes, follow-up history and reminders</td><td>Provide the service</td><td>Contract (for you); your own basis for your customers</td><td>Until you delete them or your account</td></tr>
        <tr><td>Whop membership ID and access status. When you buy, we pass your workspace&apos;s random internal ID (not your name or email) to Whop so the payment can be matched to your account.</td><td>Verify your purchase and grant or revoke access automatically</td><td>Contract</td><td>Life of account; [X years] if needed for tax/accounting records</td></tr>
        <tr><td>Technical data: IP address, browser user agent, request logs</td><td>Security, abuse prevention, rate limiting, debugging</td><td>Legitimate interests</td><td>Per provider log retention [VERIFY Vercel/Supabase log retention]; our in-memory rate-limit counters are not stored</td></tr>
        <tr><td>Webhook event IDs (no content)</td><td>Prevent processing a payment event twice</td><td>Legitimate interests</td><td>30 days</td></tr>
      </tbody></table>
      <p>We do not use analytics, advertising, tracking pixels, or social-media plugins. We do not sell or share personal data for advertising, and we do not use your data to train AI models. We do not make automated decisions with legal or similarly significant effects; the priority score only orders your own to-do list.</p>
      <p>Payment card details are handled entirely by Whop. We never see or store them.</p>

      <h2>Who receives data (processors)</h2>
      <ul>
        <li><strong>Supabase</strong> — database, authentication and auth emails. Region: [SUPABASE PROJECT REGION].</li>
        <li><strong>Vercel</strong> — hosting and request logs.</li>
        <li><strong>Whop</strong> — checkout and payments. Whop processes your purchase under its own privacy policy as [VERIFY: independent controller / merchant of record].</li>
        <li>[EMAIL PROVIDER if you configure custom SMTP for auth emails]</li>
      </ul>
      <p>We may disclose data if required by law or to protect our rights and users&apos; safety.</p>

      <h2>International transfers</h2>
      <p>Our providers may process data in the United States and other countries. Where required we rely on appropriate safeguards such as the European Commission&apos;s Standard Contractual Clauses or the EU–US Data Privacy Framework. [VERIFY each provider&apos;s mechanism.]</p>

      <h2>Your rights</h2>
      <p>Depending on where you live (for example under the GDPR, UK GDPR, California CCPA/CPRA, or Ethiopia&apos;s Personal Data Protection Proclamation No. 1321/2024), you may have the right to access, correct, delete, export or restrict your data, object to processing, and withdraw consent. You can export your data (Settings → Your data) and delete your account (Settings → Delete account) yourself at any time. For anything else email [PRIVACY EMAIL]; we respond within 30 days. We will not discriminate against you for exercising your rights.</p>
      <p>If your customer contacts us about their data, we will refer them to you as the controller and help you respond.</p>

      <h2>Complaints</h2>
      <p>You can complain to your local data-protection authority (for example your EU supervisory authority, the UK ICO, or [ETHIOPIAN AUTHORITY — verify current regulator]). We&apos;d appreciate the chance to help first.</p>

      <h2>Security</h2>
      <p>We use encrypted connections (HTTPS), database row-level security so each business can only access its own records, hashed passwords, and limited access to production systems. No method of storage or transmission is completely secure. If a breach affects your data we will notify you and regulators as the law requires.</p>

      <h2>Children</h2>
      <p>QuoteRevive is a business tool and is not intended for anyone under 18. We do not knowingly collect children&apos;s data; contact us if you believe we have.</p>

      <h2>Cookies</h2>
      <p>See the <Link href="/legal/cookies">Cookie Policy</Link>.</p>

      <h2>Changes</h2>
      <p>We&apos;ll post updates here with a new date and email you about material changes.</p>
    </LegalPage>
  );
}
