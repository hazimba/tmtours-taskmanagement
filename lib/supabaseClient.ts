// use this in client components
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL! ||
  "https://qkjejkhpcuoprfeurssd.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_ANON_KEY! ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFramVqa2hwY3VvcHJmZXVyc3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDQxMjEsImV4cCI6MjA5Mjc4MDEyMX0.eYJZcXCWvM9UMW_x4mu8jaXaRVaXQ9bBA5xEuEtk1Jg";

export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
