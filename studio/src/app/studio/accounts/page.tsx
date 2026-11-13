import { ActionButton } from "@/components/ActionButton";
import { LocalTime } from "@/components/LocalTime";
import { listAccounts } from "@/lib/data";
import { igAppIdForDisplay, igConfigured, igRedirectUri } from "@/lib/instagram";
import { requireMember } from "@/lib/members";
import { disconnectAccount } from "../actions";

export const metadata = { title: "Accounts" };
const MSG: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Instagram connected." },
  denied: { ok: false, text: "Instagram access was declined." },
  state: { ok: false, text: "The connection link expired or didn't match. Try again." },
  error: { ok: false, text: "Instagram connection failed. Check that the account is a Business or Creator account and is added as a tester on the Meta app (see Setup)." },
  not_configured: { ok: false, text: "Add the Instagram app keys in Vercel first (see Setup)." },
};

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ ig?: string }> }) {
  await requireMember();
  const { ig } = await searchParams;
  const accounts = await listAccounts();
  const msg = ig ? MSG[ig] : undefined;
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Accounts</h1>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`card mb-6 font-semibold ${msg.ok ? "text-good" : "text-bad"}`}>{msg.text}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card space-y-3" aria-labelledby="ig-h">
          <h2 id="ig-h" className="text-xl font-bold">Instagram</h2>
          <p className="text-sm text-muted">Posts, carousels and Reels publish automatically at the scheduled time. Needs a Business or Creator account.</p>
          {accounts.filter((a) => a.platform === "instagram").map((a) => (
            <div key={a.id} className="rounded-xl border border-line p-3 text-sm">
              <p className="font-semibold">@{a.username}</p>
              <p className="text-muted">Access renews automatically. Current token valid until <LocalTime iso={a.token_expires_at} fallback="unknown" />.</p>
              <div className="mt-2"><ActionButton action={disconnectAccount.bind(null, a.id)} label="Disconnect" variant="danger" confirm="Disconnect this Instagram account? Its scheduled posts become drafts." /></div>
            </div>
          ))}
          {igConfigured() && (
            <p className="text-xs text-muted">App ID in use: <code>{igAppIdForDisplay()}</code>. This must be the <strong>Instagram app ID</strong> from Meta → Instagram → API setup with Instagram login, not the Facebook App ID from App settings → Basic. Redirect URL Meta must allow: <code className="break-all">{igRedirectUri()}</code></p>
          )}
          {igConfigured() ? <a href="/api/instagram/connect" className="btn-primary">{accounts.some((a) => a.platform === "instagram") ? "Reconnect / add account" : "Connect Instagram"}</a>
            : <p className="text-sm text-warn">Instagram app keys aren't set yet. <a href="/studio/setup" className="underline">Setup guide</a></p>}
        </section>
        <section className="card space-y-3" aria-labelledby="tt-h">
          <h2 id="tt-h" className="text-xl font-bold">TikTok</h2>
          <p className="text-sm">TikTok only lets apps post publicly after it audits the app (usually a few weeks, and it can be refused). Until then, apps can post only <strong>private</strong> videos. That doesn't help you, so Studio prepares TikTok posts instead:</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Schedule the TikTok post here like any other.</li>
            <li>When it's due, it appears on <a href="/studio" className="underline">Today</a>.</li>
            <li>Download the media, copy the caption, post it in the TikTok app, then tap “I posted it”.</li>
          </ol>
          <p className="text-sm text-muted">Tip: keep Today open on your phone, or add it to your home screen.</p>
        </section>
      </div>
    </>
  );
}
