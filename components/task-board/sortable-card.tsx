"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/app/types";
import { TaskCard } from "@/components/task-card";
import { cn } from "@/lib/utils";

export function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSelf,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("touch-none", isSelf && "opacity-40")}
      suppressHydrationWarning
    >
      <TaskCard task={task} />
    </div>
  );
}
