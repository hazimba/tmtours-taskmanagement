import { createClient } from "@/lib/supabase/client";
import { Task } from "@/types";
import { TaskBoard } from "@/components/task-board";

const TaskPage = async () => {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

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
      <TaskBoard initialTasks={(tasks ?? []) as Task[]} />
    </div>
  );
};

export default TaskPage;
