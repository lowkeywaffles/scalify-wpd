"use client";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { createUpload, registerAsset } from "@/app/studio/actions";

const ACCEPT = "image/jpeg,image/png,video/mp4,video/quicktime";

export function Uploader({ supabaseUrl, anonKey }: { supabaseUrl: string; anonKey: string }) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const router = useRouter();

  async function upload() {
    const files = Array.from(fileRef.current?.files ?? []);
    if (!files.length) { setLog(["Choose at least one file."]); return; }
    setBusy(true);
    const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const out: string[] = [];
    for (const f of files) {
      const start = await createUpload({ mime: f.type, size: f.size });
      if (!start.ok) { out.push(`${f.name}: ${start.error}`); setLog([...out]); continue; }
      const { error } = await client.storage.from("studio-media").uploadToSignedUrl(start.path, start.token, f, { contentType: f.type });
      if (error) { out.push(`${f.name}: upload failed (${error.message}).`); setLog([...out]); continue; }
      const reg = await registerAsset({ path: start.path, mime: f.type, label: label || f.name.replace(/\.[^.]+$/, "") });
      out.push(reg.ok ? `${f.name}: added.` : `${f.name}: ${reg.error}`);
      setLog([...out]);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    setLabel("");
    router.refresh();
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-bold">Upload media</h2>
      <div>
        <label htmlFor={`${id}-file`} className="label">Files</label>
        <input id={`${id}-file`} ref={fileRef} type="file" accept={ACCEPT} multiple className="input py-2" aria-describedby={`${id}-help`} />
        <p id={`${id}-help`} className="help">JPEG or PNG images, MP4 or MOV videos, up to 50 MB each. Instagram's API only accepts JPEG photos. Reels work best at 1080×1920, H.264 with AAC audio.</p>
      </div>
      <div>
        <label htmlFor={`${id}-label`} className="label">Description</label>
        <input id={`${id}-label`} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} className="input" placeholder="e.g. FIRST6 offer reel" aria-describedby={`${id}-lhelp`} />
        <p id={`${id}-lhelp`} className="help">Describe what's in the image. Studio uses this as its alt text. If left empty, the file name is used.</p>
      </div>
      <button type="button" className="btn-primary" onClick={upload} disabled={busy}>{busy ? "Uploading…" : "Upload"}</button>
      <ul role="status" aria-live="polite" className="space-y-1 text-sm">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </div>
  );
}
