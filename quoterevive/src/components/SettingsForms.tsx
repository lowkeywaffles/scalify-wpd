"use client";
import { useActionState, useRef, useState, useTransition } from "react";
import { changeEmail, changePassword, deleteAccount, saveAvatar, saveSettings, type ActionState } from "@/app/app/actions";
import type { Business } from "@/lib/data";
import { aria, Field, Notice } from "./ui";
import { LANGUAGE_LABEL, LANGUAGES } from "@/lib/templates";

function Result({ s }: { s: ActionState }) {
  return <div aria-live="polite">{s.error ? <Notice kind="error">{s.error}</Notice> : s.message ? <Notice kind="ok">{s.message}</Notice> : null}</div>;
}

export function AvatarForm({ current, initials }: { current: string | null; initials: string }) {
  const [state, setState] = useState<ActionState>({});
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  async function onFile(f?: File) {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setState({ error: "Use a JPEG, PNG or WebP image." });
    if (f.size > 5_000_000) return setState({ error: "Image must be under 5 MB." });
    const bmp = await createImageBitmap(f);
    const side = Math.min(bmp.width, bmp.height);
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    c.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 160, 160); // centre square crop
    const url = c.toDataURL("image/jpeg", 0.82);
    start(async () => setState(await saveAvatar(url)));
  }
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- small data: URL avatar */}
      {current ? <img src={current} alt="Your profile photo" width={64} height={64} className="h-16 w-16 rounded-full object-cover" /> :
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-xl font-bold text-accent" aria-hidden="true">{initials}</span>}
      <div className="flex flex-wrap gap-2">
        <label className="btn btn-ghost cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]">
          {pending ? "Saving…" : "Upload photo"}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {current && <button type="button" className="btn btn-ghost" onClick={() => start(async () => setState(await saveAvatar(null)))}>Remove photo</button>}
      </div>
      <p className="hint w-full">Cropped to a square and resized to 160 px on your device before upload.</p>
      <Result s={state} />
    </div>
  );
}

export function PreferencesForm({ b }: { b: Business }) {
  const [s, action, pending] = useActionState<ActionState, FormData>(saveSettings, {});
  const e = s.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field id="display_name" label="Your name" optional error={e.display_name}><input {...aria("display_name", e.display_name)} className="input" defaultValue={b.display_name ?? ""} maxLength={80} autoComplete="name" /></Field>
      <Field id="name" label="Business name" error={e.name}><input {...aria("name", e.name)} className="input" defaultValue={b.name} maxLength={120} required /></Field>
      <Field id="currency" label="Default currency" error={e.currency}><input {...aria("currency", e.currency)} className="input uppercase" defaultValue={b.currency} maxLength={3} /></Field>
      <Field id="typical_quote_value" label="Typical quote value" error={e.typical_quote_value}><input {...aria("typical_quote_value", e.typical_quote_value)} className="input" inputMode="decimal" defaultValue={b.typical_quote_value} /></Field>
      <Field id="preferred_channel" label="Preferred follow-up channel" error={e.preferred_channel}>
        <select {...aria("preferred_channel", e.preferred_channel)} className="input" defaultValue={b.preferred_channel}><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="phone">Phone</option><option value="other">Other</option></select>
      </Field>
      <Field id="message_language" label="Default message language" error={e.message_language}>
        <select {...aria("message_language", e.message_language)} className="input" defaultValue={b.message_language ?? "en"}>{LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_LABEL[l]}</option>)}</select>
      </Field>
      <Field id="first_follow_up_days" label="First follow-up after (days)" error={e.first_follow_up_days}><input {...aria("first_follow_up_days", e.first_follow_up_days)} className="input" type="number" min={1} max={60} defaultValue={b.first_follow_up_days} /></Field>
      <Field id="follow_up_interval_days" label="Days between follow-ups (reminder frequency)" error={e.follow_up_interval_days}><input {...aria("follow_up_interval_days", e.follow_up_interval_days)} className="input" type="number" min={1} max={60} defaultValue={b.follow_up_interval_days} /></Field>
      <Field id="max_follow_ups" label="Stop after this many unanswered follow-ups" error={e.max_follow_ups}><input {...aria("max_follow_ups", e.max_follow_ups)} className="input" type="number" min={1} max={10} defaultValue={b.max_follow_ups} /></Field>
      <div className="flex items-center gap-3 sm:col-span-2"><button className="btn btn-primary" disabled={pending}>Save settings</button><Result s={s} /></div>
    </form>
  );
}

export function EmailForm({ email }: { email: string }) {
  const [s, action, pending] = useActionState<ActionState, FormData>(changeEmail, {});
  const e = s.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2" noValidate>
      <Field id="email" label="New email" hint={`Current: ${email}`} error={e.email}><input {...aria("email", e.email, true)} className="input" type="email" autoComplete="email" required /></Field>
      <Field id="password" label="Current password" error={e.password}><input {...aria("password", e.password)} className="input" type="password" autoComplete="current-password" required /></Field>
      <div className="flex items-center gap-3 sm:col-span-2"><button className="btn btn-ghost" disabled={pending}>Change email</button><Result s={s} /></div>
    </form>
  );
}

export function PasswordForm() {
  const [s, action, pending] = useActionState<ActionState, FormData>(changePassword, {});
  const e = s.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2" noValidate>
      <Field id="current" label="Current password" error={e.current}><input {...aria("current", e.current)} className="input" type="password" autoComplete="current-password" required /></Field>
      <Field id="newpw" label="New password" hint="At least 10 characters" error={e.password}><input id="newpw" name="password" aria-invalid={e.password ? true : undefined} aria-describedby="newpw-hint" className="input" type="password" autoComplete="new-password" minLength={10} required /></Field>
      <div className="flex items-center gap-3 sm:col-span-2"><button className="btn btn-ghost" disabled={pending}>Change password</button><Result s={s} /></div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [s, action, pending] = useActionState<ActionState, FormData>(deleteAccount, {});
  const e = s.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3" noValidate>
      <p className="text-sm">This permanently deletes your login, workspace, quotes and history. It cannot be undone. <a className="link" href="/api/export?format=json">Download your data first.</a> Deleting your account does not cancel or refund a Whop purchase — see the Refund Policy.</p>
      <Field id="confirm" label='Type DELETE to confirm' error={e.confirm}><input {...aria("confirm", e.confirm)} className="input max-w-xs" autoComplete="off" /></Field>
      <button className="btn btn-danger" disabled={pending}>{pending ? "Deleting…" : "Delete my account"}</button>
      <Result s={s} />
    </form>
  );
}
