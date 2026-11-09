import { requireBusiness } from "@/lib/data";
import { QuoteForm } from "@/components/QuoteForm";

export const metadata = { title: "New quote" };

export default async function NewQuote() {
  const { business } = await requireBusiness();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">New quote</h1>
      <QuoteForm currency={business.currency} />
    </div>
  );
}
