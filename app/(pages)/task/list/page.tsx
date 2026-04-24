import { createClient } from "@/lib/supabase/client";
import { Task, User } from "@/types";
import { TaskListView } from "@/components/task-list-view";
import { createClient as createClientServer } from "@/lib/supabase/server";

export default async function TaskListPage() {
  const supabase = await createClient();
  const supabaseServer = await createClientServer();

  const [{ data: tasks }, { data: users }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, avatar_url"),
  ]);

  const {
    data: { user: currentUser },
  } = await supabaseServer.auth.getUser();

  // Find the full user profile from the users list if currentUser exists
  const currentUserProfile =
    currentUser && users
      ? (users.find((u) => u.id === currentUser.id) as User | null)
      : null;

  return (
    <TaskListView
      initialTasks={(tasks ?? []) as Task[]}
      users={(users ?? []) as Pick<User, "id" | "full_name" | "avatar_url">[]}
      currentUser={currentUserProfile}
    />
  );
}
