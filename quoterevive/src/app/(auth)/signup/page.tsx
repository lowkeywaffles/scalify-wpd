import { SignupForm } from "@/components/AuthForms";
export const metadata = { title: "Create account" };
export default function Signup() {
  return (<><h1 className="font-display text-3xl">Start recovering quotes</h1><p className="mb-6 mt-2 text-sm text-muted">Free workspace with up to 10 quotes. No card required.</p><SignupForm /></>);
}
