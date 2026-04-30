import { Profile, Task } from "@/app/types";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { createClient } from "@/lib/supabase/server";
import { RecentTasksFilterCard } from "./RecentTasksFilterCard";
import { HomeStats } from "./HomeStats";
import NoActiveCycleRender from "@/components/no-active-cycle-render";

const HomePage = async () => {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const meta = currentUser?.user_metadata as Record<string, string> | undefined;
  const activeCompanyId = await getActiveCompanyId(meta);

  const { data: cycleData } = await supabase
    .from("cycles")
    .select("id")
    .eq("status", "ACTIVE")
    .eq("company_id", activeCompanyId)
    .single();

  console.log("cycleData", cycleData);

  // if (cycleData === null) {
  //   return (
  //     <NoActiveCycleRender
  //       title="DASHBOARD"
  //       description="No active cycle found. Please create a cycle to manage tasks."
  //     />
  //   );
  // }

  const tasksQuery = supabase
    .from("tasks")
    .select("*")
    .eq("is_archived", false)
    .eq("cycle_id", cycleData?.id ?? "")
    .order("created_at", { ascending: false });

  const usersQuery = supabase
    .from("profiles")
    .select("id, full_name, avatar_url");

  if (activeCompanyId) {
    tasksQuery.eq("company_id", activeCompanyId);
    usersQuery.eq("company_id", activeCompanyId);
  }

  const [{ data: rawTasks }, { data: rawUsers }] = await Promise.all([
    tasksQuery,
    usersQuery,
  ]);

  const tasks = (rawTasks ?? []) as Task[];
  const users = (rawUsers ?? []) as Pick<
    Profile,
    "id" | "full_name" | "avatar_url"
  >[];

  return (
    <div className="space-y-6 pb-6 mx-1">
      <div>
        <h1 className="text-xl font-bold tracking-widest">DASHBOARD</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overview of all tasks which cycle is ACTIVE
        </p>
      </div>

      <HomeStats
        tasks={tasks}
        users={users}
        currentUserId={currentUser?.id ?? null}
      />

      <RecentTasksFilterCard tasks={tasks} users={users} />
    </div>
  );
};

export default HomePage;
