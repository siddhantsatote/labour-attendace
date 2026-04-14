import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://mkuuhqvdrzyzymfzrlgz.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdXVocXZkcnp5enltZnpybGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDE5ODYsImV4cCI6MjA5MTExNzk4Nn0.gxTqicGko10-izPmR7sZw73tok49ai9VluWmxxU7Hwg";

let supabaseClient = null;

if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info("Using Supabase credentials from Vercel environment variables.");
}

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
  }

  return supabaseClient;
}
