// app/api/users/update-metadata/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: Request) {
  const body = await req.json();

  const { userId, full_name } = body;

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        full_name,
      },
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
