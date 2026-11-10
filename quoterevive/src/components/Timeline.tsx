import { MessageCircle, Reply, RefreshCw, StickyNote } from "lucide-react";
import { Activity, STATUS_LABEL, QuoteStatus } from "@/lib/types";

const ICON = { follow_up: MessageCircle, customer_response: Reply, status_change: RefreshCw, note: StickyNote };
const TITLE = { follow_up: "Follow-up recorded", customer_response: "Customer responded", status_change: "Status changed", note: "Note" };

export function Timeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) return <p className="text-sm text-muted">No activity yet. Record a follow-up to start the timeline.</p>;
  return (
    <ol className="relative space-y-4 border-l border-line pl-6">
      {[...activities].reverse().map((a) => {
        const Icon = ICON[a.kind];
        return (
          <li key={a.id} className="relative">
            <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface"><Icon className="h-3.5 w-3.5 text-accent" aria-hidden="true" /></span>
            <p className="text-sm font-semibold">
              {TITLE[a.kind]}
              {a.kind === "status_change" && a.to_status ? `: ${a.from_status ? STATUS_LABEL[a.from_status as QuoteStatus] : "—"} → ${STATUS_LABEL[a.to_status as QuoteStatus]}` : ""}
              {a.channel ? <span className="font-normal text-muted"> via {a.channel}</span> : null}
              {a.via_link ? <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">via customer link</span> : null}
            </p>
            {a.summary && <p className="text-sm text-muted" dir="auto">{a.summary}</p>}
            {a.contributed_to_sale && <p className="text-xs text-good">You marked this as contributing to the sale.</p>}
            <time className="text-xs text-muted" dateTime={a.occurred_at}>{new Date(a.occurred_at).toLocaleString()}</time>
          </li>
        );
      })}
    </ol>
  );
}
