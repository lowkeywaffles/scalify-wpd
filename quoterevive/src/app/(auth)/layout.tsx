import Link from "next/link";
import { Wordmark } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8 self-start" aria-label="QuoteRevive home"><Wordmark /></Link>
      <div className="card p-6 sm:p-8">{children}</div>
    </main>
  );
}
