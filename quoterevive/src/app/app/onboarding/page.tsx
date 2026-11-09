import { requireBusiness } from "@/lib/data";
import { OnboardingForm } from "@/components/OnboardingForm";
import { skipOnboarding } from "../actions";

export const metadata = { title: "Set up your workspace" };

export default async function Onboarding() {
  const { business } = await requireBusiness();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-4xl">Set up your workspace</h1>
        <p className="mt-2 text-muted">Five quick questions. You can change everything later in Settings.</p>
      </div>
      <OnboardingForm business={business} />
      <form action={skipOnboarding}><button className="link text-sm">Skip for now</button></form>
    </div>
  );
}
