import { LoginForm } from "@/components/AuthForms";
import { Notice } from "@/components/ui";
export const metadata = { title: "Sign in" };
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (<><h1 className="mb-6 font-display text-3xl">Welcome back</h1>{sp.error && <div className="mb-4"><Notice kind="error">That link is invalid or has expired.</Notice></div>}<LoginForm next={sp.next} /></>);
}
