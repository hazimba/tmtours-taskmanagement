import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! ||
      "https://qkjejkhpcuoprfeurssd.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! ||
      "sb_publishable_s9r4azwonS2k1jOaELcCNw_RDKMT8t8"
  );
}
