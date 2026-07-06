// Central API base URL. Prefer VITE_API_URL; fall back to the legacy
// VITE_SUPABASE_URL name so older builds/envs keep working (Q42).
export const API_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_SUPABASE_URL;

export const APP_URL =
  import.meta.env.VITE_APP_URL ?? "https://app.eroderunnersclub.com";
