import { PostCard } from "@/components/PostCard";
import { POST_COLS, postsWithAssets, type PostRow } from "@/lib/data";
import { requireMember } from "@/lib/members";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Posts" };
const TABS = [
  { key: "upcoming", label: "Upcoming", statuses: ["scheduled", "publishing", "ready"] },
  { key: "drafts", label: "Drafts", statuses: ["draft"] },
  { key: "failed", label: "Failed", statuses: ["failed"] },
  { key: "done", label: "Published", statuses: ["published", "posted_manually"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
] as const;

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireMember();
  const { tab: t } = await searchParams;
  const tab = TABS.find((x) => x.key === t) ?? TABS[0];
  const db = await supabaseServer();
  const done = tab.key === "done" || tab.key === "cancelled";
  const { data } = await db.from("studio_posts").select(POST_COLS).in("status", [...tab.statuses])
    .order(done ? "updated_at" : "scheduled_at", { ascending: !done, nullsFirst: false }).limit(100);
  const posts = (data ?? []) as PostRow[];
  const assets = await postsWithAssets(posts);
  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Posts</h1>
      <nav aria-label="Post status" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((x) => (
          <a key={x.key} href={`/studio/posts?tab=${x.key}`} aria-current={x.key === tab.key ? "page" : undefined}
            className={`pill px-3.5 py-1.5 text-sm ${x.key === tab.key ? "border-lime bg-lime text-lime-ink" : ""}`}>{x.label}</a>
        ))}
      </nav>
      {posts.length === 0 ? <p className="text-muted">Nothing here. <a className="underline" href="/studio/compose">Create a post</a></p> : (
        <div className="grid gap-4 md:grid-cols-2">{posts.map((p) => <PostCard key={p.id} post={p} assets={assets} />)}</div>
      )}
    </>
  );
}
