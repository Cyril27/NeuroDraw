export const SUPABASE_URL = "https://fzgljqihruhafuqxvduy.supabase.co";
export const SUPABASE_KEY = "YOUR_ANON_KEY";

export const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
