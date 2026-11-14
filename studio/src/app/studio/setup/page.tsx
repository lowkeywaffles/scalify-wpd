import { activeProvider } from "@/lib/ai";
import { publicEnv } from "@/lib/env";
import { igConfigured, igRedirectUri } from "@/lib/instagram";
import { requireMember } from "@/lib/members";

export const metadata = { title: "Setup" };

function Step({ n, title, children, done }: { n: number; title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <li className="card">
      <h2 className="mb-2 text-lg font-bold"><span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-lime text-sm text-lime-ink">{n}</span>{title}{done ? <span className="ml-2 pill text-good">Done</span> : null}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </li>
  );
}

export default async function SetupPage() {
  await requireMember();
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold">Setup guide</h1>
      <p className="mb-6 text-muted">One-time steps. Never paste keys or passwords into chats or into Studio. Put them only in Vercel as <strong>Sensitive</strong> environment variables.</p>
      <ol className="space-y-4">
        <Step n={1} title="Make the Instagram account a professional account">
          <p>In the Instagram app: Settings → <em>Account type and tools</em> → <em>Switch to professional account</em> → choose <strong>Business</strong> or <strong>Creator</strong>. It's free and you can switch back.</p>
        </Step>
        <Step n={2} title="Set up Unified Login in your Meta app" done={igConfigured()}>
          <ol className="list-decimal space-y-1 pl-5">
            <li>At <a className="underline" href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">developers.facebook.com/apps</a>, open your app. Then go to <em>Use cases → Instagram API → Customize → API setup with Unified login</em>.</li>
            <li><strong>1. Configure your app:</strong> choose <em>Create new configuration</em>, then <em>Use this configuration</em>. Copy its <strong>Configuration ID</strong>.</li>
            <li>Under <em>Redirect URL</em>, register this URL exactly and click Save:
              <code className="mt-1 block break-all rounded-lg bg-surface-2 p-2">{igRedirectUri()}</code></li>
            <li><strong>2. Generate access tokens → Add account:</strong> invite the Instagram account as an Instagram Tester. Accept the invite on instagram.com: Settings → <em>Website permissions → Apps and websites → Tester invites</em>.</li>
            <li>Leave the app in <strong>Development</strong> mode. Accounts with a role on the app get standard access, so no App Review is needed for your own accounts.</li>
          </ol>
        </Step>
        <Step n={3} title="Add the keys in Vercel" done={igConfigured()}>
          <p>Vercel → project <strong>scalify-studio</strong> → Settings → Environment Variables (Production):</p>
          <ul className="list-disc pl-5">
            <li><code>INSTAGRAM_APP_ID</code>: the Meta <strong>App ID</strong> (App settings → Basic)</li>
            <li><code>INSTAGRAM_APP_SECRET</code>: the Meta <strong>App secret</strong> (App settings → Basic). Mark it <strong>Sensitive</strong>.</li>
            <li><code>INSTAGRAM_CONFIG_ID</code>: the Configuration ID from step 2. It isn't secret.</li>
          </ul>
          <p>Redeploy, then go to <a className="underline" href="/studio/accounts">Accounts</a> → <em>Connect Instagram</em>, log in, and select the Instagram account.</p>
        </Step>
        <Step n={4} title="Optional: free AI captions with Gemini" done={activeProvider() !== "templates"}>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com/apikey</a> and sign in with Google. Use the business account if you can.</li>
            <li><em>Create API key</em>. Stay on the free tier: don't turn on billing.</li>
            <li>In Vercel add <code>GEMINI_API_KEY</code> (Sensitive) and redeploy.</li>
          </ol>
          <p className="text-warn"><strong>Privacy:</strong> on the free tier, Google may use what you send to improve its products, and people may review it. Put only public marketing ideas in the brief, never customer names, emails or private details.</p>
          <p>Later, to switch to Claude: add <code>ANTHROPIC_API_KEY</code> (paid) and set <code>STUDIO_AI_PROVIDER</code> = <code>claude</code>. If no key works, Studio falls back to built-in templates.</p>
        </Step>
        <Step n={5} title="Invite your co-founders">
          <p>Add their emails on <a className="underline" href="/studio/team">Team</a> and send them this address: <code>{publicEnv.siteUrl}</code></p>
        </Step>
      </ol>
      <section className="card mt-6 text-sm" aria-labelledby="limits-h">
        <h2 id="limits-h" className="mb-2 text-lg font-bold">Good to know</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Instagram allows up to 100 API-published posts per 24 hours, and at most 5 hashtags per post.</li>
          <li>Photos must be JPEG. Reels: MP4/MOV, H.264 + AAC, 3 seconds to 15 minutes. Files up to 50 MB (Supabase free plan).</li>
          <li>Stories, music from Instagram's library, collaborators, product tags and location tags can't be added through the API. Add them in the app after posting if needed.</li>
          <li>Scheduled times are checked every 5 minutes.</li>
          <li>Music: only use audio you have the rights to. Free ElevenLabs voices are not licensed for commercial posts.</li>
        </ul>
      </section>
    </>
  );
}
