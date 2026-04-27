import { Profile, Task } from "@/app/types";
import { TaskListView } from "@/components/task-list-view";
import { createClient as createClientServer } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";

export default async function TaskListPage() {
  const supabaseServer = await createClientServer();

  const {
    data: { user: currentUser },
  } = await supabaseServer.auth.getUser();

  const meta = currentUser?.user_metadata as Record<string, string> | undefined;
  const activeCompanyId = await getActiveCompanyId(meta);

  const usersQuery = supabaseServer
    .from("profiles")
    .select("id, full_name, avatar_url");

  const tasksQuery = supabaseServer
    .from("tasks")
    .select("*, companies(id, name)")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (activeCompanyId) {
    usersQuery.eq("company_id", activeCompanyId);
    tasksQuery.eq("company_id", activeCompanyId);
  }

  const [{ data: users }, { data: tasks }] = await Promise.all([
    usersQuery,
    tasksQuery,
  ]);

  const currentUserProfile =
    currentUser && users
      ? (users.find((u) => u.id === currentUser.id) as Profile | null)
      : null;

  return (
    <TaskListView
      initialTasks={(tasks ?? []) as Task[]}
      users={
        (users ?? []) as Pick<Profile, "id" | "full_name" | "avatar_url">[]
      }
      currentUser={currentUserProfile}
    />
  );
}
