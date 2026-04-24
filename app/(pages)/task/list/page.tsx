import { createClient } from "@/lib/supabase/client";
import { Task, User } from "@/types";
import { TaskListView } from "@/components/task-list-view";

export default async function TaskListPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: users }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, avatar_url"),
  ]);

  return (
    <TaskListView
      initialTasks={(tasks ?? []) as Task[]}
      users={(users ?? []) as Pick<User, "id" | "full_name" | "avatar_url">[]}
    />
  );
}
