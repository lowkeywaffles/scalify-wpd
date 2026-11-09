import { z } from "zod";
import { QUOTE_STATUSES } from "./types";

const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const optDate = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date");

export const quoteSchema = z
  .object({
    customer_name: z.string().trim().min(1, "Customer name is required").max(120),
    customer_email: z.string().trim().max(200).optional().transform((v) => (v ? v : null)).refine((v) => v === null || z.string().email().safeParse(v).success, "Enter a valid email"),
    customer_phone: optText(40),
    title: z.string().trim().min(1, "Describe the job or project").max(160),
    description: optText(2000),
    amount: z.coerce.number({ message: "Enter an amount" }).finite().min(0, "Amount can't be negative").max(1e10),
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter code like USD"),
    sent_at: optDate,
    expires_at: optDate,
    status: z.enum(QUOTE_STATUSES),
    next_follow_up_at: optDate,
    notes: optText(4000),
  })
  .refine((q) => !q.sent_at || !q.expires_at || q.expires_at >= q.sent_at, {
    message: "Expiry must be on or after the sent date",
    path: ["expires_at"],
  });
export type QuoteInput = z.infer<typeof quoteSchema>;

export const onboardingSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required").max(120),
  industry: z.string().trim().max(60).optional().transform((v) => v || null),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter code"),
  typical_quote_value: z.coerce.number().min(0).max(1e10).optional().transform((v) => v ?? 0),
  preferred_channel: z.enum(["whatsapp", "email", "phone", "other"]),
});

export const activitySchema = z.object({
  quote_id: z.string().uuid(),
  kind: z.enum(["follow_up", "customer_response", "note"]),
  channel: z.enum(["whatsapp", "email", "phone", "other"]).nullable().optional(),
  summary: z.string().trim().max(500).optional().transform((v) => v || null),
  new_status: z.enum(QUOTE_STATUSES).optional(),
  next_follow_up_at: optDate,
  contributed_to_sale: z.boolean().optional(),
});
