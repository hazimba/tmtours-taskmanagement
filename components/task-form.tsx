"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { taskSchema, type TaskFormData } from "@/lib/validations/task";
import { Task, TaskPriority, TaskStatus, User } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SingleDatePicker } from "@/components/single-date-picker";
import { ArrowLeft, X, Plus, Loader2, Link2 } from "lucide-react";

// ─── props ────────────────────────────────────────────────────────────────────

interface TaskFormProps {
  /** Pass existing task to switch to "edit" mode */
  task?: Task;
}

// ─── component ────────────────────────────────────────────────────────────────

export function TaskForm({ task }: TaskFormProps) {
  const isEdit = !!task;
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tagInput, setTagInput] = useState("");

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
        }
      : {
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          tags: [],
        },
  });

  const watchedTags = useWatch({ control, name: "tags" }) ?? [];
  const watchedParentId = useWatch({ control, name: "parent_id" }) ?? "";
  const watchedStatus = useWatch({ control, name: "status" });
  const watchedPriority = useWatch({ control, name: "priority" });
  const watchedAssignedTo = useWatch({ control, name: "assigned_to" }) ?? "";
  const watchedStartDate = useWatch({ control, name: "start_date" }) ?? "";
  const watchedDueDate = useWatch({ control, name: "due_date" }) ?? "";

  // ── data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const [{ data: usersData }, { data: tasksData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, email"),
        supabase
          .from("tasks")
          .select("id, title, status")
          .eq("is_archived", false)
          .order("created_at", { ascending: false }),
      ]);
      if (usersData) setUsers(usersData as User[]);
      if (tasksData)
        setAllTasks(
          (tasksData as Task[]).filter((t) => !isEdit || t.id !== task?.id)
        );
    }
    load();
  }, [isEdit, task?.id]);

  // ── tag helpers ────────────────────────────────────────────────────────────

  function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed || watchedTags.includes(trimmed)) return;
    setValue("tags", [...watchedTags, trimmed]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setValue(
      "tags",
      watchedTags.filter((t) => t !== tag)
    );
  }

  // ── submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: TaskFormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("Submitting task with data:", data); // Debug log

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
            parent_id: data.parent_id || null,
          })
          .eq("id", task!.id);
        if (error) throw error;
        toast.success("Task updated!");
        router.push(`/task/${task!.id}`);
      } else {
        const { error } = await supabase.from("tasks").insert([
          {
            id: uuidv4(),
            parent_id: data.parent_id || null,
            created_by: user.id,
            is_archived: false,
            ...data,
          },
        ]);
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

  // ── render ─────────────────────────────────────────────────────────────────

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
        <Card className="px-5 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Basic Info
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="What needs to be done?"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                <span className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Parent Task
                </span>
              </Label>
              <Select
                value={watchedParentId}
                onValueChange={(v) =>
                  setValue("parent_id", v === "none" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select parent..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Standalone —</SelectItem>
                  {allTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="truncate">{t.title}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Add more context, steps, or notes..."
              rows={4}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="px-5 py-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assignment & Status
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={watchedStatus}
                  onValueChange={(v) => setValue("status", v as TaskStatus)}
                  disabled={!isEdit}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>
                      In Progress
                    </SelectItem>
                    <SelectItem value={TaskStatus.REVIEW}>Review</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>
                      Completed
                    </SelectItem>
                    <SelectItem value={TaskStatus.CANCELLED}>
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={watchedPriority}
                  onValueChange={(v) => setValue("priority", v as TaskPriority)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                    <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select
                value={watchedAssignedTo}
                onValueChange={(v) =>
                  setValue("assigned_to", v === "unassigned" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assign to someone…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">— Unassigned —</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="px-5 py-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Timeline
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <SingleDatePicker
                  value={
                    watchedStartDate ? new Date(watchedStartDate) : undefined
                  }
                  onChange={(date) =>
                    setValue("start_date", date?.toISOString() ?? "")
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <SingleDatePicker
                  value={watchedDueDate ? new Date(watchedDueDate) : undefined}
                  onChange={(date) =>
                    setValue("due_date", date?.toISOString() ?? "")
                  }
                />
              </div>
            </div>
          </Card>
          <Card className="px-5 py-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categorization
            </p>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register("category")}
                  placeholder="e.g. Marketing, Development…"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {watchedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pb-10">
          <Button type="submit" disabled={isSubmitting} className="">
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
