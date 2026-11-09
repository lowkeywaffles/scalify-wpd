import { LoginForm } from "@/components/AuthForms";
import { Notice } from "@/components/ui";
export const metadata = { title: "Sign in" };
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (<><h1 className="mb-6 font-display text-3xl">Welcome back</h1>{sp.error === "reset" && <div className="mb-4"><Notice kind="error">That reset link is invalid or has expired. Request a new one from &quot;Forgot password?&quot;.</Notice></div>}
    {sp.error === "link" && <div className="mb-4"><Notice kind="info">We couldn&apos;t sign you in from that link — this usually happens when it opens in a different browser. Your email is most likely confirmed already, so try signing in below.</Notice></div>}<LoginForm next={sp.next} /></>);
}
