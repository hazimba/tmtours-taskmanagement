import { createClient as sp } from "@/lib/supabase/server";
import { Task } from "@/app/types";
import { TaskBoard } from "@/components/task-board";
import { getActiveCompanyId } from "@/lib/get-active-company";

const TaskPage = async () => {
  const supabaseServer = await sp();

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">Task Management</h1>
        <p className="text-red-500">You must be logged in to view tasks.</p>
      </div>
    );
  }

  const meta = user.user_metadata as Record<string, string> | undefined;
  const activeCompanyId = await getActiveCompanyId(meta);

  const query = supabaseServer
    .from("tasks")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (activeCompanyId) query.eq("company_id", activeCompanyId);

  const { data: tasks, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">Task Management</h1>
        <p className="text-red-500">Failed to load tasks. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TaskBoard
        key={activeCompanyId ?? "all"}
        initialTasks={(tasks ?? []) as Task[]}
      />
    </div>
  );
};

export default TaskPage;
