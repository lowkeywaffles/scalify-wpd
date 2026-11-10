export const metadata = { title: "Contact & business details" };
export default function Contact() {
  return (
    <div className="prose-legal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">Contact & support</h1>
      <p>We handle support through Whop. If you&apos;ve bought Founding Access, open your QuoteRevive purchase on whop.com and send us a message there. We usually reply within [2 business days].</p>
      <p>Haven&apos;t bought yet? Find QuoteRevive on Whop and message the seller from the product page.</p>
      <p>Please don&apos;t send your customers&apos; personal details in messages — describe the issue instead. You can export or delete your own data any time in Settings.</p>
      <h2>Business details</h2>
      <table><tbody>
        <tr><th scope="row">Legal name</th><td>[LEGAL BUSINESS NAME]</td></tr>
        <tr><th scope="row">Registered address</th><td>[REGISTERED ADDRESS]</td></tr>
        <tr><th scope="row">Registration / trade licence no.</th><td>[REGISTRATION NUMBER — required in some countries]</td></tr>
        <tr><th scope="row">Tax ID / VAT / TIN</th><td>[TAX ID, if required]</td></tr>
        <tr><th scope="row">Privacy requests</th><td>Message us on Whop, or use Settings to export or delete your data yourself</td></tr>
      </tbody></table>
      <p className="text-sm text-muted">Placeholders shown in brackets must be completed before launch.</p>
    </div>
  );
}
