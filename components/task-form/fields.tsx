"use client";

import { UseFormRegister, UseFormSetValue, Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { TaskFormData } from "@/lib/validations/task";
import { Profile, Task, TaskPriority, TaskStatus } from "@/app/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SingleDatePicker } from "@/components/single-date-picker";
import { X, Plus, Link2 } from "lucide-react";
import { useState } from "react";

interface TaskFieldsProps {
  register: UseFormRegister<TaskFormData>;
  setValue: UseFormSetValue<TaskFormData>;
  control: Control<TaskFormData>;
  errors: Record<string, { message?: string } | undefined>;
  isEdit: boolean;
  users: Profile[];
  allTasks: Task[];
  cycles: { id: string; name: string }[];
}

export function TaskFields({
  register,
  setValue,
  control,
  errors,
  isEdit,
  users,
  allTasks,
  cycles,
}: TaskFieldsProps) {
  const [tagInput, setTagInput] = useState("");
  const watchedTags = useWatch({ control, name: "tags" }) ?? [];
  const watchedParentId = useWatch({ control, name: "parent_id" }) ?? "";
  const watchedCycleId = useWatch({ control, name: "cycle_id" }) ?? "";
  const watchedStatus = useWatch({ control, name: "status" });
  const watchedPriority = useWatch({ control, name: "priority" });
  const watchedAssignedTo = useWatch({ control, name: "assigned_to" }) ?? "";
  const watchedStartDate = useWatch({ control, name: "start_date" }) ?? "";
  const watchedDueDate = useWatch({ control, name: "due_date" }) ?? "";

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

  return (
    <div className="mx-1 space-y-6">
      {/* Basic Info */}
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

        {/* Cycle selector */}
        <div className="space-y-2">
          <Label>
            <span className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Cycle (Sprint)
            </span>
          </Label>
          <Select
            value={watchedCycleId}
            onValueChange={(v) => setValue("cycle_id", v === "none" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Link to a cycle..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No Cycle —</SelectItem>
              {cycles.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assignment & Status */}
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

        {/* Timeline */}
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

        {/* Categorization */}
        <Card className="px-5 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categorization
          </p>
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
        </Card>
      </div>
    </div>
  );
}
