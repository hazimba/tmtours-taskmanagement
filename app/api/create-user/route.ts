import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Server-only admin client — never exposed to browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL! ||
    "https://qkjejkhpcuoprfeurssd.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY! ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFramVqa2hwY3VvcHJmZXVyc3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIwNDEyMSwiZXhwIjoyMDkyNzgwMTIxfQ.9KXX2L6z9lclHK0G0VjESdkpwZNT72Dhu1TcZa_tmGo",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, company_id, role } = await req.json();

    if (!email || !password || !company_id) {
      return NextResponse.json(
        { error: "email, password and company_id are required" },
        { status: 400 }
      );
    }

    // Create the auth user directly — no email confirmation needed
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // skip email verification
        user_metadata: { company_id, role: role ?? "USER" },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create a profile stub — full_name intentionally left null
    // so the first-login redirect to /auth/signup is triggered
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email,
        company_id,
        role: role ?? "USER",
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
