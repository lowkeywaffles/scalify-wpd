import { LocalTime } from "@/components/LocalTime";
import { PostCard } from "@/components/PostCard";
import { activeProvider } from "@/lib/ai";
import { listAccounts, POST_COLS, postsWithAssets, type PostRow } from "@/lib/data";
import { igConfigured } from "@/lib/instagram";
import { requireMember } from "@/lib/members";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Today" };

export default async function Today() {
  await requireMember();
  const db = await supabaseServer();
  const weekAhead = new Date(Date.now() + 7 * 86400_000).toISOString();
  const [{ data: ready }, { data: failed }, { data: upcoming }, accounts] = await Promise.all([
    db.from("studio_posts").select(POST_COLS).eq("status", "ready").order("scheduled_at").limit(20),
    db.from("studio_posts").select(POST_COLS).eq("status", "failed").order("updated_at", { ascending: false }).limit(10),
    db.from("studio_posts").select(POST_COLS).in("status", ["scheduled", "publishing"]).lte("scheduled_at", weekAhead).order("scheduled_at").limit(20),
    listAccounts(),
  ]);
  const all = [...(ready ?? []), ...(failed ?? [])] as PostRow[];
  const assets = await postsWithAssets(all);
  const ig = accounts.find((a) => a.platform === "instagram");
  const setup = [
    { done: igConfigured(), text: "Instagram app keys added in Vercel" },
    { done: Boolean(ig), text: "Instagram account connected" },
    { done: activeProvider() !== "templates", text: "AI key added (optional; templates work without it)" },
  ];

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Today</h1>
      {setup.some((s) => !s.done) && (
        <section className="card mb-6" aria-labelledby="setup-h">
          <h2 id="setup-h" className="mb-2 text-lg font-bold">Finish setup</h2>
          <ul className="space-y-1 text-sm">{setup.map((s) => <li key={s.text}><span aria-hidden="true">{s.done ? "✅" : "⬜"}</span> <span className="sr-only">{s.done ? "Done:" : "To do:"}</span> {s.text}</li>)}</ul>
          <a href="/studio/setup" className="btn-primary mt-3">Open the setup guide</a>
        </section>
      )}

      <section aria-labelledby="ready-h" className="mb-8">
        <h2 id="ready-h" className="mb-3 text-xl font-bold">Post now on TikTok ({ready?.length ?? 0})</h2>
        {ready?.length ? <div className="grid gap-4 md:grid-cols-2">{(ready as PostRow[]).map((p) => <PostCard key={p.id} post={p} assets={assets} />)}</div>
          : <p className="text-muted">Nothing waiting. When a TikTok post's time comes, it shows up here with the media and caption ready to copy.</p>}
      </section>

      {failed?.length ? (
        <section aria-labelledby="failed-h" className="mb-8">
          <h2 id="failed-h" className="mb-3 text-xl font-bold text-bad">Needs attention ({failed.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">{(failed as PostRow[]).map((p) => <PostCard key={p.id} post={p} assets={assets} />)}</div>
        </section>
      ) : null}

      <section aria-labelledby="up-h" className="card">
        <h2 id="up-h" className="mb-3 text-xl font-bold">Next 7 days</h2>
        {upcoming?.length ? (
          <ul className="divide-y divide-line">
            {(upcoming as PostRow[]).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="w-40 shrink-0 font-semibold"><LocalTime iso={p.scheduled_at} /></span>
                <span className="w-20 shrink-0">{p.platform === "instagram" ? "Instagram" : "TikTok"}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{p.caption || "(no caption)"}</span>
                <a href={`/studio/compose?edit=${p.id}`} className="underline">Edit</a>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted">Nothing scheduled. <a className="underline" href="/studio/compose">Plan a post</a></p>}
      </section>
    </>
  );
}
