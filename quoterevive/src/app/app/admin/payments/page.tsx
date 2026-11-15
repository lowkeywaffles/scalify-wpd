import { redirect } from "next/navigation";

// Payments for every Scalify product are now reviewed in one place.
export default function PaymentsAdmin() {
  redirect("https://scalify-wpd.vercel.app/admin");
}
