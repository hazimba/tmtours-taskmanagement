import { cookies } from "next/headers";

/**
 * Returns the company_id that should be used for data filtering.
 *
 * - SUPERADMIN: returns the cookie `selected_company_id` if set,
 *   otherwise null (= show all companies)
 * - Everyone else: always returns their own company_id from JWT metadata
 */
export async function getActiveCompanyId(
  userMetadata: Record<string, string> | null | undefined
): Promise<string | null> {
  const role = userMetadata?.role;
  const ownCompanyId = userMetadata?.company_id ?? null;

  if (role !== "SUPERADMIN") return ownCompanyId;

  const cookieStore = await cookies();
  const selected = cookieStore.get("selected_company_id")?.value;
  return selected ?? null; // null = all companies (superadmin default)
}
