import { ActionButton } from "@/components/ActionButton";
import { Thumb } from "@/components/Thumb";
import { Uploader } from "@/components/Uploader";
import { listAssets } from "@/lib/data";
import { publicEnv } from "@/lib/env";
import { requireMember } from "@/lib/members";
import { deleteAsset } from "../actions";

export const metadata = { title: "Library" };
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

export default async function LibraryPage() {
  await requireMember();
  const assets = await listAssets(200);
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Library</h1>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Uploader supabaseUrl={publicEnv.supabaseUrl} anonKey={publicEnv.supabaseAnonKey} />
        <section aria-labelledby="files-h">
          <h2 id="files-h" className="mb-3 text-lg font-bold">{assets.length} file{assets.length === 1 ? "" : "s"}</h2>
          {assets.length === 0 ? <p className="text-muted">Nothing here yet. Upload your reels, posts and slides.</p> : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {assets.map((a) => (
                <li key={a.id} className="card p-3">
                  {a.kind === "video" && a.url
                    ? <video src={a.url} controls preload="metadata" className="aspect-[9/16] w-full rounded-lg bg-black object-contain" aria-label={a.label ?? "Video"} />
                    : <Thumb url={a.url} kind={a.kind} label={a.label} className="aspect-square w-full" />}
                  <p className="mt-2 truncate text-sm font-semibold" title={a.label ?? undefined}>{a.label ?? "Untitled"}</p>
                  <p className="text-xs text-muted">{a.mime.split("/")[1].toUpperCase()} · {mb(a.size_bytes)}{a.mime === "image/png" ? " · TikTok only" : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.downloadUrl && <a href={a.downloadUrl} className="btn-ghost min-h-9 px-4">Download</a>}
                    <ActionButton action={deleteAsset.bind(null, a.id)} label="Delete" variant="danger" confirm="Delete this file permanently?" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
