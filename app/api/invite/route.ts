import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Uses Supabase service role key (server-only) to invite users

export async function POST(req: NextRequest) {
  const supabaseAdmin = await createClient();
  try {
    const { email, company_id, company_name, role } = await req.json();

    if (!email || !company_id) {
      return NextResponse.json(
        { error: "Email and company_id are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/signup`,
        data: {
          company_id,
          company_name,
          role: role ?? "USER",
          invited: true,
        },
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user_id: data.user.id });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
