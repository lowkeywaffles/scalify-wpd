export const QUOTE_STATUSES = [
  "draft",
  "sent",
  "awaiting_response",
  "follow_up_due",
  "negotiating",
  "accepted",
  "rejected",
  "expired",
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  awaiting_response: "Awaiting response",
  follow_up_due: "Follow-up due",
  negotiating: "Negotiating",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

/** Statuses where the deal is finished and no follow-up should be suggested. */
export const CLOSED_STATUSES: readonly QuoteStatus[] = ["accepted", "rejected", "expired"];

export type Channel = "whatsapp" | "email" | "phone" | "other";

export interface Quote {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  sent_at: string | null; // ISO date (YYYY-MM-DD)
  expires_at: string | null;
  status: QuoteStatus;
  next_follow_up_at: string | null;
  notes: string | null;
  archived: boolean;
  opted_out: boolean;
  created_at: string;
  updated_at: string;
}

export type ActivityKind = "follow_up" | "customer_response" | "status_change" | "note";

export interface Activity {
  id: string;
  quote_id: string;
  kind: ActivityKind;
  channel: Channel | null;
  summary: string | null;
  from_status: QuoteStatus | null;
  to_status: QuoteStatus | null;
  contributed_to_sale: boolean | null;
  occurred_at: string;
}
