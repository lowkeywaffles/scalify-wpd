import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { currentMember } from "@/lib/members";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await currentMember()) redirect("/studio");
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-3"><Logo /><span className="text-lg font-bold">Scalify Studio</span></div>
      <div className="card">
        <h1 className="mb-1 text-2xl font-bold">Sign in</h1>
        <p className="mb-5 text-sm text-muted">Private workspace for the Scalify team. No passwords: we email you a one-time code.</p>
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-xs text-muted"><a href="/privacy" className="underline">How Studio handles data</a></p>
    </main>
  );
}
