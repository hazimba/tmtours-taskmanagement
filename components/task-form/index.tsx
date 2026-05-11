"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { taskSchema, type TaskFormData } from "@/lib/validations/task";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { TaskFields } from "./fields";
import {
  Profile,
  TaskPriority,
  TaskStatus,
  ActivityType,
  ActivityAction,
} from "@/app/types";
import { Task } from "@/app/types";
import { useCompanyStore } from "@/lib/stores/company-store";
import { logActivity } from "@/lib/log-activity";

interface TaskFormProps {
  task?: Task;
}

export function TaskForm({ task }: TaskFormProps) {
  const isEdit = !!task;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<Profile[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [cycles, setCycles] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const triggerTaskRefresh = useCompanyStore((s) => s.triggerTaskRefresh);

  const presetCycleId = searchParams.get("cycle_id") ?? undefined;
  const copyTitle = searchParams.get("title") ?? undefined;
  const copyDefaults = copyTitle
    ? {
        title: copyTitle,
        description: searchParams.get("description") ?? "",
        priority:
          (searchParams.get("priority") as TaskPriority) ?? TaskPriority.MEDIUM,
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
      ? {
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          category: task.category ?? "",
          tags: task.tags ?? [],
          assigned_to: task.assigned_to ?? "",
          parent_id: task.parent_id ?? "",
          start_date: task.start_date ?? "",
          due_date: task.due_date ?? "",
          cycle_id: task.cycle_id ?? "",
          department_id: task.department_id ?? "",
        }
      : copyDefaults
      ? { ...copyDefaults, cycle_id: presetCycleId ?? "", department_id: "" }
      : {
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          tags: [],
          cycle_id: presetCycleId ?? "",
          department_id: "",
        },
  });

  useEffect(() => {
    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return;

      // Fetch current user's profile to get their company_id (via profiles_company_id_fkey)
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", authUser.id)
        .single();

      const cid = myProfile?.company_id ?? null;
      setCompanyId(cid);

      if (!cid) return;

      const [
        { data: usersData },
        { data: tasksData },
        { data: cyclesData },
        { data: departmentsData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, email, company_id")
          .eq("company_id", cid),
        supabase
          .from("tasks")
          .select("id, title, status")
          .eq("is_archived", false)
          .eq("company_id", cid)
          .order("created_at", { ascending: false }),
        supabase
          .from("cycles")
          .select("id, name")
          .eq("is_archived", false)
          .eq("company_id", cid)
          .order("created_at", { ascending: false }),
        supabase
          .from("departments")
          .select("id, name")
          .eq("company_id", cid)
          .order("name", { ascending: true }),
      ]);

      if (usersData) setUsers(usersData as Profile[]);
      if (tasksData)
        setAllTasks(
          (tasksData as Task[]).filter((t) => !isEdit || t.id !== task?.id)
        );
      if (cyclesData) setCycles(cyclesData as { id: string; name: string }[]);
      if (departmentsData)
        setDepartments(departmentsData as { id: string; name: string }[]);
    }
    load();
  }, [isEdit, task?.id]);

  const onSubmit = async (data: TaskFormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      toast.error("You must be logged in.");
      router.push("/login");
      return;
    }

    try {
      if (isEdit) {
        const { error } = await supabase
          .from("tasks")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
            assigned_to: data.assigned_to || null,
            parent_id: data.parent_id || null,
            start_date: data.start_date || null,
            due_date: data.due_date || null,
            cycle_id: data.cycle_id || null,
            department_id: data.department_id || null,
          })
          .eq("id", task!.id);
        if (error) throw error;

        // Log changed fields as individual activities
        const fieldLogs: Array<{
          type: ActivityType;
          old: Record<string, unknown>;
          new: Record<string, unknown>;
        }> = [];
        if (data.status !== task!.status)
          fieldLogs.push({
            type: ActivityType.STATUS_CHANGE,
            old: { status: task!.status },
            new: { status: data.status },
          });
        if (data.priority !== task!.priority)
          fieldLogs.push({
            type: ActivityType.PRIORITY_CHANGE,
            old: { priority: task!.priority },
            new: { priority: data.priority },
          });
        if ((data.assigned_to || null) !== task!.assigned_to) {
          const findName = (id: string | null | undefined) =>
            users.find((u) => u.id === id)?.full_name ?? null;
          fieldLogs.push({
            type: ActivityType.ASSIGNEE_CHANGE,
            old: {
              assigned_to: task!.assigned_to,
              full_name: findName(task!.assigned_to),
            },
            new: {
              assigned_to: data.assigned_to || null,
              full_name: findName(data.assigned_to),
            },
          });
        }
        if ((data.due_date || null) !== task!.due_date)
          fieldLogs.push({
            type: ActivityType.DUE_DATE_CHANGE,
            old: { due_date: task!.due_date },
            new: { due_date: data.due_date || null },
          });
        if ((data.cycle_id || null) !== task!.cycle_id)
          fieldLogs.push({
            type: ActivityType.CYCLE_CHANGE,
            old: { cycle_id: task!.cycle_id },
            new: { cycle_id: data.cycle_id || null },
          });
        if ((data.department_id || null) !== task!.department_id)
          fieldLogs.push({
            type: ActivityType.DEPARTMENT_CHANGE,
            old: { department_id: task!.department_id },
            new: { department_id: data.department_id || null },
          });
        if ((data.parent_id || null) !== task!.parent_id) {
          const findTitle = (id: string | null | undefined) =>
            allTasks.find((t) => t.id === id)?.title ?? null;
          fieldLogs.push({
            type: ActivityType.PARENT_CHANGE,
            old: {
              parent_id: task!.parent_id,
              title: findTitle(task!.parent_id),
            },
            new: {
              parent_id: data.parent_id || null,
              title: findTitle(data.parent_id),
            },
          });
        }
        if (data.title !== task!.title)
          fieldLogs.push({
            type: ActivityType.TITLE_CHANGE,
            old: { title: task!.title },
            new: { title: data.title },
          });
        if ((data.description || null) !== task!.description)
          fieldLogs.push({
            type: ActivityType.DESCRIPTION_CHANGE,
            old: { description: task!.description },
            new: { description: data.description || null },
          });

        await Promise.all(
          fieldLogs.map((f) =>
            logActivity({
              task_id: task!.id,
              user_id: user.id,
              company_id: companyId,
              type: f.type,
              action: ActivityAction.UPDATED,
              old_value: f.old,
              new_value: f.new,
            })
          )
        );

        toast.success("Task updated!");
        triggerTaskRefresh();
        router.push(`/task/${task!.id}`);
      } else {
        const {
          title,
          description,
          status,
          priority,
          category,
          tags,
          assigned_to,
          parent_id,
          start_date,
          due_date,
          cycle_id,
          department_id,
        } = data;
        const newId = uuidv4();
        const { error } = await supabase.from("tasks").insert([
          {
            id: newId,
            created_by: user.id,
            is_archived: false,
            company_id: companyId,
            title,
            description: description || null,
            status,
            priority,
            category: category || null,
            tags,
            assigned_to: assigned_to || null,
            parent_id: parent_id || null,
            start_date: start_date || null,
            due_date: due_date || null,
            cycle_id: cycle_id || null,
            department_id: department_id || null,
          },
        ]);
        if (error) throw error;

        await logActivity({
          task_id: newId,
          user_id: user.id,
          company_id: companyId,
          type: ActivityType.CREATED,
          action: ActivityAction.CREATED,
          new_value: { title },
        });

        toast.success("Task created!");
        triggerTaskRefresh();
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
        <Button
          type="button"
          variant="link"
          className="mb-3 !px-0 cursor-pointer !no-underline"
          onClick={() =>
            isEdit ? router.push(`/task/${task!.id}`) : router.push("/task")
          }
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? "Back to Task" : "Back to Tasks"}
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Task" : "Create New Task"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit
            ? "Update the task details below"
            : "Fill in the details to create a new task"}
        </p>
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
          cycles={cycles}
          departments={departments}
        />

        <div className="flex justify-end gap-3 pb-10">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
              ? "Save Changes"
              : "Create Task"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() =>
              isEdit ? router.push(`/task/${task!.id}`) : router.push("/task")
            }
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
