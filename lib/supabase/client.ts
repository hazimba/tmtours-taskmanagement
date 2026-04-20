import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! ||
      "https://mlapxffieyehdpvuzsyw.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! ||
      "sb_publishable_ZOmLKMqnmBsr9RgREljNkw_D9-H3i0x"
  );
}
