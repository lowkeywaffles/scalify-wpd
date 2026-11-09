/** Entirely fictional demo data. Names, numbers and businesses are invented; phone/email use reserved example ranges. */
import { addDays } from "./dates";
import { Activity, Quote, QuoteStatus } from "./types";

export const DEMO_BUSINESS = { name: "Northline Print Studio (demo)", currency: "USD", typical: 800 };

export function demoWorkspace(todayIso: string): { quotes: Quote[]; activities: Activity[] } {
  const d = (n: number) => addDays(todayIso, n);
  const mk = (i: number, name: string, title: string, amount: number, sent: number, status: QuoteStatus, next: number | null, expires: number | null): Quote => ({
    id: `demo-${i}`, customer_name: name, customer_email: `customer${i}@example.com`, customer_phone: null,
    title, description: "Fictional demo quote.", amount, currency: "USD", sent_at: d(sent), expires_at: expires === null ? null : d(expires),
    status, next_follow_up_at: next === null ? null : d(next), notes: null, archived: false, opted_out: false,
    created_at: `${d(sent)}T09:00:00Z`, updated_at: `${d(sent)}T09:00:00Z`,
  });
  const quotes = [
    mk(1, "Sarah Lin", "website", 2400, -8, "awaiting_response", -2, 6),
    mk(2, "Daniel Okafor", "shopfront sign", 1150, -5, "sent", 0, 20),
    mk(3, "Meron Tesfaye", "event banners", 640, -12, "follow_up_due", -3, 3),
    mk(4, "Priya Raman", "kitchen cabinet refit", 5200, -20, "negotiating", 0, 10),
    mk(5, "Tom Becker", "logo refresh", 450, -3, "sent", 2, null),
    mk(6, "Hana Yusuf", "wedding photo booth", 900, -30, "accepted", null, null),
    mk(7, "Leo Martins", "AC servicing contract", 1300, -25, "rejected", null, null),
    mk(8, "Ama Boateng", "vehicle wrap", 3100, -40, "awaiting_response", -10, -5),
    mk(9, "Chris Doyle", "office signage", 780, -1, "draft", null, null),
  ];
  const a = (i: number, q: number, kind: Activity["kind"], day: number, extra: Partial<Activity> = {}): Activity => ({
    id: `demo-a${i}`, quote_id: `demo-${q}`, kind, channel: kind === "follow_up" ? "whatsapp" : null, summary: null,
    from_status: null, to_status: null, contributed_to_sale: null, occurred_at: `${d(day)}T10:00:00Z`, ...extra,
  });
  const activities = [
    a(1, 1, "follow_up", -5, { summary: "Friendly message" }),
    a(2, 4, "follow_up", -14, { summary: "Professional message", channel: "email" }),
    a(3, 4, "customer_response", -12, { summary: "Asked for a cheaper material option" }),
    a(4, 6, "follow_up", -26, { summary: "Friendly message" }),
    a(5, 6, "customer_response", -24, { summary: "Confirmed the booking", contributed_to_sale: true }),
    a(6, 6, "status_change", -24, { from_status: "awaiting_response", to_status: "accepted" }),
    a(7, 7, "customer_response", -20, { summary: "Went with another provider" }),
    a(8, 8, "follow_up", -30, {}), a(9, 8, "follow_up", -20, {}),
  ];
  return { quotes, activities };
}
