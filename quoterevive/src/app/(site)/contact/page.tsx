import { publicEnv } from "@/lib/env";
export const metadata = { title: "Contact & business details" };
export default function Contact() {
  return (
    <div className="prose-legal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">Contact & support</h1>
      <p>Email <a href={`mailto:${publicEnv.supportEmail}`}>{publicEnv.supportEmail}</a>. We usually reply within [2 business days]. Please don&apos;t send your customers&apos; personal details by email — describe the issue instead.</p>
      <h2>Business details</h2>
      <table><tbody>
        <tr><th scope="row">Legal name</th><td>[LEGAL BUSINESS NAME]</td></tr>
        <tr><th scope="row">Registered address</th><td>[REGISTERED ADDRESS]</td></tr>
        <tr><th scope="row">Registration / trade licence no.</th><td>[REGISTRATION NUMBER — required in some countries]</td></tr>
        <tr><th scope="row">Tax ID / VAT / TIN</th><td>[TAX ID, if required]</td></tr>
        <tr><th scope="row">Privacy contact</th><td>[PRIVACY EMAIL]</td></tr>
      </tbody></table>
      <p className="text-sm text-muted">Placeholders shown in brackets must be completed before launch.</p>
    </div>
  );
}
