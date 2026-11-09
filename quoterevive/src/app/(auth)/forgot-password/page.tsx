import { ForgotForm } from "@/components/AuthForms";
export const metadata = { title: "Reset password" };
export default function Forgot() {
  return (<><h1 className="mb-6 font-display text-3xl">Reset your password</h1><ForgotForm /></>);
}
