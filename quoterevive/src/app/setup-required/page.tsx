import Link from "next/link";
export const metadata = { title: "Setup required", robots: { index: false } };
export default function SetupRequired() {
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-20">
      <h1 className="font-display text-4xl">Supabase isn&apos;t configured</h1>
      <p className="mt-4 text-muted">Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (see README) to use the app. The <Link className="link" href="/demo">demo</Link> works without it.</p>
    </main>
  );
}
