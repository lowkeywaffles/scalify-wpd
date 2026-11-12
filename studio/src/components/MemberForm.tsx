"use client";
import { useActionState } from "react";
import { addMember, type Result } from "@/app/studio/actions";

export function MemberForm() {
  const [state, action, pending] = useActionState(addMember, { ok: false } as Result);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-60 flex-1"><label htmlFor="m-email" className="label">Email</label><input id="m-email" name="email" type="email" required className="input" /></div>
      <div><label htmlFor="m-role" className="label">Role</label>
        <select id="m-role" name="role" className="input"><option value="member">Member</option><option value="owner">Owner (can manage team)</option></select></div>
      <button className="btn-primary" disabled={pending}>{pending ? "Adding…" : "Add"}</button>
      {(state.message || state.error) && <p role={state.ok ? "status" : "alert"} className={`w-full text-sm font-semibold ${state.ok ? "text-good" : "text-bad"}`}>{state.ok ? state.message : state.error}</p>}
    </form>
  );
}
