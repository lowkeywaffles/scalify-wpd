import { Composer } from "@/components/Composer";
import { activeProvider } from "@/lib/ai";
import { listAccounts, listAssets, POST_COLS, type PostRow } from "@/lib/data";
import { requireMember } from "@/lib/members";
import type { Format } from "@/lib/rules";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Create" };
const LABEL = { gemini: "Using Gemini (free tier)", claude: "Using Claude", templates: "Using built-in templates" } as const;

export default async function ComposePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireMember();
  const { edit } = await searchParams;
  const [assets, accounts] = await Promise.all([listAssets(), listAccounts()]);
  let initial;
  if (edit && /^[0-9a-f-]{36}$/.test(edit)) {
    const db = await supabaseServer();
    const { data } = await db.from("studio_posts").select(POST_COLS).eq("id", edit).maybeSingle();
    const p = data as PostRow | null;
    if (p && ["draft", "scheduled", "failed", "ready", "cancelled"].includes(p.status)) {
      initial = { id: p.id, platform: p.platform, format: p.format as Format, caption: p.caption, hashtags: p.hashtags, assetIds: p.asset_ids, scheduledAt: p.scheduled_at };
    }
  }
  return (
    <>
      <h1 className="mb-1 text-3xl font-bold">{initial ? "Edit post" : "Create a post"}</h1>
      <p className="mb-6 text-muted">{initial ? "Saving moves it back to the state you choose below." : "Pick media, write the caption (or let the assistant draft it), then schedule."}</p>
      <Composer key={initial?.id ?? "new"} assets={assets} igConnected={accounts.some((a) => a.platform === "instagram")} providerLabel={LABEL[activeProvider()]} initial={initial} />
    </>
  );
}
