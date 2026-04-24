"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { taskSchema, type TaskFormData } from "@/lib/validations/task";
import { Task, TaskPriority, TaskStatus, User } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { TaskFields } from "./fields";

interface TaskFormProps {
  task?: Task;
}

export function TaskForm({ task }: TaskFormProps) {
  const isEdit = !!task;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const copyTitle = searchParams.get("title") ?? undefined;
  const copyDefaults = copyTitle
    ? {
        title: copyTitle,
        description: searchParams.get("description") ?? "",
        priority: (searchParams.get("priority") as TaskPriority) ?? TaskPriority.MEDIUM,
        category: searchParams.get("category") ?? "",
        start_date: searchParams.get("start_date") ?? "",
        due_date: searchParams.get("due_date") ?? "",
        tags: searchParams.get("tags")?.split(",").filter(Boolean) ?? [],
        status: TaskStatus.TODO,
      }
    : null;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TaskFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(taskSchema) as any,
    defaultValues: isEdit
      ? { title: task.title, description: task.description ?? "", status: task.status, priority: task.priority, category: task.category ?? "", tags: task.tags ?? [], assigned_to: task.assigned_to ?? "", parent_id: task.parent_id ?? "", start_date: task.start_date ?? "", due_date: task.due_date ?? "" }
      : copyDefaults
      ? { ...copyDefaults }
      : { status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, tags: [] },
  });

  useEffect(() => {
    async function load() {
      const [{ data: usersData }, { data: tasksData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, email"),
        supabase.from("tasks").select("id, title, status").eq("is_archived", false).order("created_at", { ascending: false }),
      ]);
      if (usersData) setUsers(usersData as User[]);
      if (tasksData) setAllTasks((tasksData as Task[]).filter((t) => !isEdit || t.id !== task?.id));
    }
    load();
  }, [isEdit, task?.id]);

  const onSubmit = async (data: TaskFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) { toast.error("You must be logged in."); router.push("/login"); return; }

    try {
      if (isEdit) {
        const { error } = await supabase.from("tasks").update({ ...data, updated_at: new Date().toISOString(), assigned_to: data.assigned_to || null, parent_id: data.parent_id || null, start_date: data.start_date || null, due_date: data.due_date || null }).eq("id", task!.id);
        if (error) throw error;
        toast.success("Task updated!");
        router.push(`/task/${task!.id}`);
      } else {
        const { error } = await supabase.from("tasks").insert([{ id: uuidv4(), parent_id: data.parent_id || null, assigned_to: data.assigned_to || null, created_by: user.id, is_archived: false, ...data }]);
        if (error) throw error;
        toast.success("Task created!");
        reset();
        router.push("/task");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${isEdit ? "update" : "create"} task.`);
    }
  };

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <Button type="button" variant="link" className="mb-3 !px-0 cursor-pointer !no-underline" onClick={() => isEdit ? router.push(`/task/${task!.id}`) : router.push("/task")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? "Back to Task" : "Back to Tasks"}
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? "Edit Task" : "Create New Task"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{isEdit ? "Update the task details below" : "Fill in the details to create a new task"}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <TaskFields
          register={register}
          setValue={setValue}
          control={control}
          errors={errors as Record<string, { message?: string } | undefined>}
          isEdit={isEdit}
          users={users}
          allTasks={allTasks}
        />

        <div className="flex justify-end gap-3 pb-10">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Task")}
          </Button>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => isEdit ? router.push(`/task/${task!.id}`) : router.push("/task")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
