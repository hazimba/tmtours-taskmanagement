"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setSelectedCompany(companyId: string | null) {
  const cookieStore = await cookies();
  if (companyId) {
    cookieStore.set("selected_company_id", companyId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });
  } else {
    cookieStore.delete("selected_company_id");
  }
  revalidatePath("/", "layout");
}
