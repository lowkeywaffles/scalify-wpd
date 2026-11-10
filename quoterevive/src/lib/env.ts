/** Public values are safe in the browser. Server-only values must never be imported by client components. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "[SUPPORT EMAIL]",
};
export const isSupabaseConfigured = () => Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
