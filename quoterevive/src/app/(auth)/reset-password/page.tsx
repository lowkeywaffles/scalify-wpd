import { ResetForm } from "@/components/AuthForms";
export const metadata = { title: "Choose a new password" };
export default function Reset() {
  return (<><h1 className="mb-6 font-display text-3xl">Choose a new password</h1><ResetForm /></>);
}
