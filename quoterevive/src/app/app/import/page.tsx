import { requireBusiness } from "@/lib/data";
import { ImportWizard } from "@/components/ImportWizard";

export const metadata = { title: "Import quotes" };

export default async function ImportPage() {
  const { business } = await requireBusiness();
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-4xl">Import quotes</h1><p className="mt-2 text-muted">Bring in quotes from a spreadsheet. Only import customer details you&apos;re allowed to keep for following up on a quote.</p></div>
      <ImportWizard currency={business.currency} />
      <p className="text-sm"><a className="link" href="/api/export">Export all quotes as CSV</a></p>
    </div>
  );
}
