/** Deterministic follow-up message templates (no AI, no cost). Non-English text: have a native speaker review before launch. */
import { daysBetween } from "./dates";
import { Quote } from "./types";

export const TONES = ["friendly", "professional", "concise", "final"] as const;
export type Tone = (typeof TONES)[number];
export const TONE_LABEL: Record<Tone, string> = { friendly: "Friendly", professional: "Professional", concise: "Concise", final: "Final check-in" };

export const LANGUAGES = ["en", "ar", "fr", "es"] as const;
export type Lang = (typeof LANGUAGES)[number];
export const LANGUAGE_LABEL: Record<Lang, string> = { en: "English", ar: "العربية (Arabic)", fr: "Français (French)", es: "Español (Spanish)" };
export const isRtl = (l: Lang) => l === "ar";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "";
}

const AGO: Record<Lang, [string, string, string, string, string]> = {
  // [recently, yesterday, a few days ago, last week, a while ago]
  en: ["recently", "yesterday", "a few days ago", "last week", "a little while ago"],
  ar: ["مؤخراً", "أمس", "قبل بضعة أيام", "الأسبوع الماضي", "منذ فترة"],
  fr: ["récemment", "hier", "il y a quelques jours", "la semaine dernière", "il y a quelque temps"],
  es: ["recientemente", "ayer", "hace unos días", "la semana pasada", "hace un tiempo"],
};
function when(sentAt: string | null, todayIso: string, lang: Lang): string {
  const w = AGO[lang];
  if (!sentAt) return w[0];
  const d = daysBetween(sentAt, todayIso);
  if (d <= 1) return w[1];
  if (d < 7) return w[2];
  if (d < 14) return w[3];
  return w[4];
}

type Ctx = { name: string; item: string; ago: string; again: boolean; biz?: string };
const sign = (biz?: string) => (biz ? `\n\n— ${biz}` : "");

const T: Record<Lang, Record<Tone, (c: Ctx) => string>> = {
  en: {
    friendly: (c) => `Hey ${c.name || "there"}, ${c.again ? "just following up again" : "just checking in"} about the ${c.item} quotation I sent ${c.ago}. Happy to answer any questions or adjust the scope if needed.${sign(c.biz)}`,
    professional: (c) => `Hello ${c.name || "there"},\n\nI'm following up on the quotation for ${c.item} sent ${c.ago}. Please let me know if you have any questions, or if you'd like any changes to the scope or timeline.\n\nKind regards${c.biz ? `,\n${c.biz}` : ""}`,
    concise: (c) => `Hi ${c.name || "there"}, any thoughts on the ${c.item} quote? Happy to help with questions.${sign(c.biz)}`,
    final: (c) => `Hi ${c.name || "there"}, I wanted to check in one last time about the ${c.item} quotation. If now isn't the right time, no problem at all — just let me know and I'll close it on my side. You're always welcome to reach out later.${sign(c.biz)}`,
  },
  ar: {
    friendly: (c) => `مرحباً ${c.name}، ${c.again ? "أردت المتابعة مجدداً" : "أردت فقط الاطمئنان"} بخصوص عرض السعر الخاص بـ${c.item} الذي أرسلته ${c.ago}. يسعدني الإجابة عن أي أسئلة أو تعديل النطاق إذا لزم الأمر.${sign(c.biz)}`,
    professional: (c) => `مرحباً ${c.name}،\n\nأتابع معكم بخصوص عرض السعر الخاص بـ${c.item} المرسل ${c.ago}. يُرجى إعلامي إن كانت لديكم أي أسئلة أو رغبتم في أي تعديل على النطاق أو الجدول الزمني.\n\nمع خالص التحية${c.biz ? `،\n${c.biz}` : ""}`,
    concise: (c) => `مرحباً ${c.name}، هل اطلعت على عرض السعر الخاص بـ${c.item}؟ يسعدني الإجابة عن أي سؤال.${sign(c.biz)}`,
    final: (c) => `مرحباً ${c.name}، أتواصل معك للمرة الأخيرة بخصوص عرض السعر الخاص بـ${c.item}. إن لم يكن الوقت مناسباً فلا مشكلة إطلاقاً، فقط أخبرني وسأغلقه من جهتي. يسعدني تواصلك في أي وقت لاحقاً.${sign(c.biz)}`,
  },
  fr: {
    friendly: (c) => `Bonjour ${c.name}, ${c.again ? "je reviens à nouveau vers vous" : "je me permets de revenir vers vous"} au sujet du devis pour ${c.item} envoyé ${c.ago}. Je reste disponible pour répondre à vos questions ou ajuster le périmètre si besoin.${sign(c.biz)}`,
    professional: (c) => `Bonjour ${c.name},\n\nJe fais suite au devis pour ${c.item} envoyé ${c.ago}. N'hésitez pas à me faire part de vos questions ou des modifications souhaitées concernant le périmètre ou le calendrier.\n\nCordialement${c.biz ? `,\n${c.biz}` : ""}`,
    concise: (c) => `Bonjour ${c.name}, avez-vous pu consulter le devis pour ${c.item} ? Je reste à votre disposition.${sign(c.biz)}`,
    final: (c) => `Bonjour ${c.name}, je reviens une dernière fois vers vous au sujet du devis pour ${c.item}. Si le moment n'est pas idéal, aucun souci — dites-le-moi simplement et je le clôturerai de mon côté. N'hésitez pas à me recontacter plus tard.${sign(c.biz)}`,
  },
  es: {
    friendly: (c) => `Hola ${c.name}, ${c.again ? "quería volver a escribirte" : "solo quería saber cómo va todo"} sobre la cotización de ${c.item} que te envié ${c.ago}. Con gusto respondo cualquier pregunta o ajusto el alcance si hace falta.${sign(c.biz)}`,
    professional: (c) => `Hola ${c.name}:\n\nLe escribo para dar seguimiento a la cotización de ${c.item} enviada ${c.ago}. Quedo a su disposición para cualquier pregunta o cambio en el alcance o los plazos.\n\nSaludos cordiales${c.biz ? `,\n${c.biz}` : ""}`,
    concise: (c) => `Hola ${c.name}, ¿pudiste revisar la cotización de ${c.item}? Avísame si tienes preguntas.${sign(c.biz)}`,
    final: (c) => `Hola ${c.name}, te escribo una última vez sobre la cotización de ${c.item}. Si no es buen momento, no hay problema: avísame y la cierro por mi parte. Puedes escribirme cuando quieras más adelante.${sign(c.biz)}`,
  },
};

export function buildMessage(
  quote: Pick<Quote, "customer_name" | "title" | "sent_at">,
  tone: Tone,
  opts: { businessName?: string; todayIso: string; previousFollowUps?: number; lang?: Lang },
): string {
  const lang = opts.lang ?? "en";
  return T[lang][tone]({
    name: firstName(quote.customer_name),
    item: quote.title.trim() || (lang === "en" ? "quotation" : "…"),
    ago: when(quote.sent_at, opts.todayIso, lang),
    again: (opts.previousFollowUps ?? 0) > 0,
    biz: opts.businessName || undefined,
  });
}

/** wa.me link: opens WhatsApp with prefilled text. Does NOT send anything. */
export function whatsappLink(phone: string | null, text: string): string {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(email: string | null, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
