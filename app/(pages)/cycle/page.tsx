import { createClient } from "@/lib/supabase/server";
import { Cycle, Task } from "@/app/types";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { CycleView } from "@/components/cycle-view";

export default async function CyclePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-red-500">You must be logged in to view cycles.</p>
      </div>
    );
  }

  const meta = user.user_metadata as Record<string, string> | undefined;
  const activeCompanyId = await getActiveCompanyId(meta);

  const cycleQuery = supabase
    .from("cycles")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (activeCompanyId) cycleQuery.eq("company_id", activeCompanyId);

  const { data: cycles } = await cycleQuery;

  // Fetch ALL non-archived tasks (cycle tasks + backlog)
  const taskQuery = supabase
    .from("tasks")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (activeCompanyId) taskQuery.eq("company_id", activeCompanyId);

  const { data: tasks } = await taskQuery;

  return (
    <CycleView
      cycles={(cycles ?? []) as Cycle[]}
      tasks={(tasks ?? []) as Task[]}
    />
  );
}
