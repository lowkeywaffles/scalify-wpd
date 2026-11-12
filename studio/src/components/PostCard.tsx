import { cancelPost, deletePost, markPosted, publishNow, retryPost } from "@/app/studio/actions";
import { composeCaption } from "@/lib/captions";
import type { AssetRow, PostRow } from "@/lib/data";
import { ActionButton } from "./ActionButton";
import { CopyButton } from "./CopyButton";
import { LocalTime } from "./LocalTime";
import { PLATFORM_LABEL, StatusPill } from "./StatusPill";
import { Thumb } from "./Thumb";

export function PostCard({ post, assets }: { post: PostRow; assets: Map<string, AssetRow> }) {
  const media = post.asset_ids.map((id) => assets.get(id)).filter(Boolean) as AssetRow[];
  const full = composeCaption(post.caption, post.hashtags);
  const editable = ["draft", "scheduled", "failed", "ready", "cancelled"].includes(post.status);
  return (
    <article className="card space-y-3" aria-label={`${PLATFORM_LABEL[post.platform]} ${post.format} post`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <strong>{PLATFORM_LABEL[post.platform]}</strong>
        <span className="text-muted">· {post.format}</span>
        <StatusPill status={post.status} />
        <span className="ml-auto text-muted"><LocalTime iso={post.published_at ?? post.scheduled_at} /></span>
      </div>
      <div className="flex gap-3">
        <ul className="flex shrink-0 gap-1">
          {media.slice(0, 3).map((m) => <li key={m.id}><Thumb url={m.url} kind={m.kind} label={m.label} /></li>)}
          {media.length > 3 && <li className="grid h-16 w-10 place-items-center text-sm text-muted">+{media.length - 3}</li>}
        </ul>
        <p className="line-clamp-4 whitespace-pre-wrap text-sm">{full || <span className="text-muted">No caption</span>}</p>
      </div>
      {post.error && <p className="rounded-lg bg-bad/10 p-2 text-sm text-bad" role="note">{post.error}</p>}
      {post.permalink && <p className="text-sm"><a className="underline" href={post.permalink} target="_blank" rel="noopener noreferrer">View on Instagram<span className="sr-only"> (opens in a new tab)</span></a></p>}
      <div className="flex flex-wrap items-start gap-2">
        {post.platform === "tiktok" && ["ready", "scheduled", "draft"].includes(post.status) && (
          <>
            <CopyButton text={full} />
            {media.map((m, i) => m.downloadUrl && <a key={m.id} href={m.downloadUrl} className="btn-ghost min-h-9 px-4">Download {media.length > 1 ? i + 1 : "media"}</a>)}
            <ActionButton action={markPosted.bind(null, post.id)} label="I posted it" variant="primary" />
          </>
        )}
        {post.platform === "instagram" && ["draft", "scheduled"].includes(post.status) && <ActionButton action={publishNow.bind(null, post.id)} label="Publish now" pendingLabel="Publishing…" variant="primary" confirm="Publish this to Instagram right now?" />}
        {post.status === "failed" && post.platform === "instagram" && <ActionButton action={retryPost.bind(null, post.id)} label="Retry" pendingLabel="Retrying…" variant="primary" />}
        {editable && <a href={`/studio/compose?edit=${post.id}`} className="btn-ghost min-h-9 px-4">Edit</a>}
        {["draft", "scheduled", "failed", "ready"].includes(post.status) && <ActionButton action={cancelPost.bind(null, post.id)} label="Cancel" />}
        {post.status !== "publishing" && <ActionButton action={deletePost.bind(null, post.id)} label="Delete" variant="danger" confirm="Delete this post from Studio? (Anything already on Instagram stays there.)" />}
      </div>
    </article>
  );
}
