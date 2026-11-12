import { ActionButton } from "@/components/ActionButton";
import { MemberForm } from "@/components/MemberForm";
import { requireMember } from "@/lib/members";
import { supabaseServer } from "@/lib/supabase/server";
import { removeMember } from "../actions";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireMember();
  const db = await supabaseServer();
  const { data } = await db.from("studio_members").select("email, role, added_by, created_at").order("created_at");
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold">Team</h1>
      <p className="mb-6 text-muted">Only people on this list can sign in. Everyone here can create, schedule, publish and delete posts.</p>
      <section className="card mb-6" aria-labelledby="list-h">
        <h2 id="list-h" className="mb-3 text-lg font-bold">Members</h2>
        <ul className="divide-y divide-line">
          {(data ?? []).map((m) => (
            <li key={m.email} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-semibold">{m.email}{m.email === me.email ? " (you)" : ""}</span>
              <span className="pill">{m.role}</span>
              {me.role === "owner" && m.email !== me.email && <ActionButton action={removeMember.bind(null, m.email)} label="Remove" variant="danger" confirm={`Remove ${m.email} from Studio?`} />}
            </li>
          ))}
        </ul>
      </section>
      {me.role === "owner" ? (
        <section className="card" aria-labelledby="add-h">
          <h2 id="add-h" className="mb-3 text-lg font-bold">Add a co-founder</h2>
          <MemberForm />
          <p className="help mt-3">Tell them the Studio web address. They sign in with a code emailed to them. Studio sends no invitation email.</p>
        </section>
      ) : <p className="text-sm text-muted">Only owners can add or remove people.</p>}
    </>
  );
}
