"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Task } from "@/app/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trash2, Copy, GitBranch, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface TaskDeleteDialogProps {
  task: Task;
  subtaskCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDeleteDialog({
  task,
  subtaskCount,
  open,
  onOpenChange,
}: TaskDeleteDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    // Cascade deletes (comments, attachments stored in JSONB, subtasks)
    // are handled by Supabase FK cascade rules.
    // We also remove any uploaded files from storage bucket.
    try {
      // Delete storage files
      // @ts-expect-error - attachments is JSONB array of { url: string, name: string }
      if (task.attachments?.length > 0) {
        // @ts-expect-error - attachments is JSONB array of { url: string, name: string }
        const filePaths = task.attachments
          // @ts-expect-error - attachments is JSONB array of { url: string, name: string }
          .filter((a) => a.url.includes("task-files"))
          .map((a: any) => {
            try {
              const url = new URL(a.url);
              const parts = url.pathname.split("/task-files/");
              return parts[1] ?? "";
            } catch {
              return "";
            }
          })
          .filter(Boolean);

        if (filePaths.length > 0) {
          await supabase.storage.from("task-files").remove(filePaths);
        }
      }

      const { error } = await supabase.from("tasks").delete().eq("id", task.id);

      if (error) throw error;

      toast.success("Task deleted successfully.");
      onOpenChange(false);
      router.push("/task");
      router.refresh();
    } catch {
      toast.error("Failed to delete task.");
      setDeleting(false);
    }
  }

  function handleCopyToCreate() {
    // Build query params from task data to pre-fill create form
    const params = new URLSearchParams({
      title: `Copy of ${task.title}`,
      ...(task.description ? { description: task.description } : {}),
      priority: task.priority,
      ...(task.category ? { category: task.category } : {}),
      ...(task.due_date ? { due_date: task.due_date } : {}),
      ...(task.start_date ? { start_date: task.start_date } : {}),
      tags: task.tags?.join(",") ?? "",
      from_copy: "true",
    });
    onOpenChange(false);
    router.push(`/task/create?${params.toString()}`);
  }

  async function handleDuplicate() {
    setDeleting(true);
    const { error } = await supabase.from("tasks").insert([
      {
        title: `Copy of ${task.title}`,
        description: task.description,
        priority: task.priority,
        status: task.status,
        category: task.category,
        tags: task.tags,
        start_date: task.start_date,
        due_date: task.due_date,
        assigned_to: task.assigned_to,
        created_by: task.created_by,
        attachments: [],
        is_archived: false,
        sort_order: task.sort_order,
      },
    ]);
    setDeleting(false);
    if (error) {
      toast.error("Failed to duplicate task.");
    } else {
      toast.success("Task duplicated successfully.");
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Task
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            You are about to permanently delete{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{task.title}&rdquo;
            </span>
            .
            {subtaskCount > 0 && (
              <>
                {" "}
                This will also delete{" "}
                <span className="font-semibold text-foreground">
                  {subtaskCount} subtask{subtaskCount !== 1 ? "s" : ""}
                </span>
                ,
              </>
            )}{" "}
            all comments and attachments. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Subtask options */}
        {subtaskCount > 0 && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              Before deleting, you can save this task:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 flex-1"
                onClick={handleCopyToCreate}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy to New Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 flex-1"
                onClick={handleDuplicate}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <GitBranch className="h-3.5 w-3.5" />
                )}
                Duplicate Task
              </Button>
            </div>
          </div>
        )}

        {/* Always show copy/duplicate options even without subtasks */}
        {subtaskCount === 0 && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Save a copy before deleting?
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 flex-1"
                onClick={handleCopyToCreate}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy to New Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 flex-1"
                onClick={handleDuplicate}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <GitBranch className="h-3.5 w-3.5" />
                )}
                Duplicate Task
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
