"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, TaskStatus } from "@/types";
import { STATUS_META } from "@/components/shared/task-meta";
import { SortableTaskCard } from "./sortable-card";
import { cn } from "@/lib/utils";

interface StatusColumnProps {
  status: TaskStatus;
  tasks: Task[];
  isOver: boolean;
}

export function StatusColumn({ status, tasks, isOver }: StatusColumnProps) {
  const meta = STATUS_META[status];
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <section className="mb-8">
      <div className={cn("flex items-center gap-2 mb-3 px-1", meta.color)}>
        {meta.icon}
        <h2 className="text-sm font-semibold">{meta.label}</h2>
        <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[120px] rounded-xl p-3 border-2 border-dashed transition-colors",
          isOver
            ? cn("border-primary/40", meta.dropBg)
            : "border-border/40 bg-gray-200 dark:bg-muted/10"
        )}
      >
        {tasks.length === 0 ? (
          <p
            className={cn(
              "text-xs text-center py-8 transition-colors",
              isOver ? "text-primary/60" : "text-muted-foreground/40"
            )}
          >
            {isOver ? "Release to move here" : "Drop tasks here"}
          </p>
        ) : (
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {tasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </section>
  );
}
