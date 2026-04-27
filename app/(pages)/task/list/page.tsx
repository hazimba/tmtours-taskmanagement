import { Profile, Task } from "@/app/types";
import { TaskListView } from "@/components/task-list-view";
import { createClient as createClientServer } from "@/lib/supabase/server";

export default async function TaskListPage() {
  const supabaseServer = await createClientServer();

  const [{ data: users }, { data: tasks }] = await Promise.all([
    supabaseServer.from("profiles").select("id, full_name, avatar_url"),
    supabaseServer
      .from("tasks")
      .select("*, companies(id, name)")
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
  ]);

  const {
    data: { user: currentUser },
  } = await supabaseServer.auth.getUser();

  // Find the full user profile from the users list if currentUser exists
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
