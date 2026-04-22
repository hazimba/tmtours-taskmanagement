import { createClient } from "@/lib/supabase/server";
import { Task } from "@/types";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !task) return notFound();

  return <TaskForm task={task as Task} />;
}
