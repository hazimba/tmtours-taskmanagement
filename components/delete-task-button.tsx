"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskDeleteDialog } from "@/components/task-delete-dialog";
import { Task } from "@/app/types";
import { Trash2 } from "lucide-react";

interface DeleteTaskButtonProps {
  task: Task;
  subtaskCount: number;
}

export function DeleteTaskButton({
  task,
  subtaskCount,
}: DeleteTaskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/40"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
      <TaskDeleteDialog
        task={task}
        subtaskCount={subtaskCount}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
