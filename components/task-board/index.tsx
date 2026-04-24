"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { supabase } from "@/lib/supabaseClient";
import { Task, TaskStatus } from "@/types";
import { TaskCard } from "@/components/task-card";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { STATUS_META } from "@/components/shared/task-meta";
import { StatusColumn } from "./status-column";

export const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

interface TaskBoardProps {
  initialTasks: Task[];
}

export function TaskBoard({ initialTasks }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const grouped = STATUS_ORDER.reduce<Record<TaskStatus, Task[]>>((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const totalActive = tasks.filter(
    (t) =>
      t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
  ).length;

  function findStatus(taskId: string): TaskStatus | null {
    for (const s of STATUS_ORDER) {
      if (grouped[s].find((t) => t.id === taskId)) return s;
    }
    return null;
  }

  function onDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  }

  function onDragOver({ over }: DragOverEvent) {
    if (!over) {
      setOverStatus(null);
      return;
    }
    const overId = over.id as string;
    const statusMatch = STATUS_ORDER.find((s) => s === overId);
    if (statusMatch) {
      setOverStatus(statusMatch);
      return;
    }
    setOverStatus(findStatus(overId));
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    setOverStatus(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const targetStatus =
      STATUS_ORDER.find((s) => s === overId) ?? findStatus(overId);
    if (!targetStatus) return;

    const sourceStatus = findStatus(activeId);
    if (!sourceStatus || sourceStatus === targetStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus } : t))
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .eq("id", activeId);

    if (error) {
      toast.error("Failed to update task status.");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: sourceStatus } : t
        )
      );
    } else {
      toast.success(`Moved to "${STATUS_META[targetStatus].label}"`, {
        duration: 2000,
      });
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="rounded-full p-5">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-base">No tasks yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first task to get started
          </p>
        </div>
        <Link href="/task/create">
          <Button className="gap-2 mt-2">
            <Plus className="h-4 w-4" />
            Add New Task
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-widest">TASK BOARD</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalActive} active task{totalActive !== 1 ? "s" : ""} · drag cards
            to change status
          </p>
        </div>
        <Link href="/task/create">
          <Button size="sm" className="gap-2 h-8">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div>
          {STATUS_ORDER.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              isOver={overStatus === status}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-1 scale-[1.03] shadow-2xl opacity-95 w-[280px] md:w-[320px]">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
