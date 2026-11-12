import { Logo } from "@/components/Logo";
import { Nav } from "@/components/Nav";
import { requireMember } from "@/lib/members";
import { signOut } from "../login/actions";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMember();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 py-4">
        <a href="/studio" className="flex items-center gap-2.5 font-bold"><Logo size={30} /> Scalify Studio</a>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">{me.email}</span>
          <form action={signOut}><button className="btn-ghost min-h-9 px-4">Sign out</button></form>
        </div>
      </header>
      <Nav />
      <main id="main" className="pt-6">{children}</main>
    </div>
  );
}
