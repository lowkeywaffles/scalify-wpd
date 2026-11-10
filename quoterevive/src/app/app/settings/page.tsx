import { requireBusiness } from "@/lib/data";
import { AvatarForm, DeleteAccountForm, EmailForm, PasswordForm, PreferencesForm } from "@/components/SettingsForms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { business, user } = await requireBusiness();
  const initials = (business.display_name || business.name || user.email || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const S = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section aria-labelledby={id} className="card space-y-4 p-4 sm:p-6"><h2 id={id} className="font-display text-2xl">{title}</h2>{children}</section>
  );
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Settings</h1>
      <S id="s-photo" title="Profile photo"><AvatarForm current={business.avatar_data_url} initials={initials} /></S>
      <div data-tour="rules"><S id="s-prefs" title="Workspace & follow-up rules"><PreferencesForm b={business} /></S></div>
      <S id="s-email" title="Email"><EmailForm email={user.email ?? ""} /></S>
      <S id="s-pw" title="Password"><PasswordForm /></S>
      <S id="s-data" title="Your data"><p className="text-sm">Export everything at any time: <a className="link" href="/api/export">quotes (CSV)</a> · <a className="link" href="/api/export?format=json">full export (JSON)</a>.</p><p className="text-sm text-muted">Notifications: QuoteRevive shows in-app reminders only. It does not send reminder emails yet.</p></S>
      <S id="s-del" title="Delete account"><DeleteAccountForm /></S>
    </div>
  );
}
