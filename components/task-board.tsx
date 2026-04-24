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
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/lib/supabaseClient";
import { Task, TaskStatus } from "@/types";
import { TaskCard } from "@/components/task-card";
import {
  CircleDashed,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── constants ────────────────────────────────────────────────────────────────

export const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; color: string; dropBg: string }
> = {
  [TaskStatus.TODO]: {
    label: "To Do",
    icon: <CircleDashed className="h-4 w-4" />,
    color: "text-slate-500",
    dropBg: "bg-slate-50 dark:bg-slate-900/30",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: <CircleDot className="h-4 w-4" />,
    color: "text-blue-500",
    dropBg: "bg-blue-50 dark:bg-blue-900/20",
  },
  [TaskStatus.REVIEW]: {
    label: "Review",
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-500",
    dropBg: "bg-amber-50 dark:bg-amber-900/20",
  },
  [TaskStatus.COMPLETED]: {
    label: "Completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-500",
    dropBg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  [TaskStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-400",
    dropBg: "bg-red-50 dark:bg-red-900/20",
  },
};

// ─── sortable card wrapper ────────────────────────────────────────────────────

function SortableTaskCard({ task }: { task: Task }) {
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

// ─── droppable column ─────────────────────────────────────────────────────────

function StatusColumn({
  status,
  tasks,
  isOver,
}: {
  status: TaskStatus;
  tasks: Task[];
  isOver: boolean;
}) {
  const meta = STATUS_META[status];

  // Make the whole column a drop target — this fixes empty columns
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className={cn("flex items-center gap-2 mb-3 px-1", meta.color)}>
        {meta.icon}
        <h2 className="text-sm font-semibold">{meta.label}</h2>
        <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone + cards grid */}
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

// ─── main board ───────────────────────────────────────────────────────────────

interface TaskBoardProps {
  initialTasks: Task[];
}

export function TaskBoard({ initialTasks }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // require 8px movement before starting drag so clicks still work
      activationConstraint: { distance: 8 },
    })
  );

  // Group tasks by status
  const grouped = STATUS_ORDER.reduce<Record<TaskStatus, Task[]>>((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const totalActive = tasks.filter(
    (t) =>
      t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
  ).length;

  // Find which column a task id belongs to
  function findStatus(taskId: string): TaskStatus | null {
    for (const s of STATUS_ORDER) {
      if (grouped[s].find((t) => t.id === taskId)) return s;
    }
    return null;
  }

  // ── drag handlers ────────────────────────────────────────────────────────

  function onDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  }

  function onDragOver({ over }: DragOverEvent) {
    if (!over) {
      setOverStatus(null);
      return;
    }

    // over could be a column id (status string) or a card id
    const overId = over.id as string;
    const statusMatch = STATUS_ORDER.find((s) => s === overId);
    if (statusMatch) {
      setOverStatus(statusMatch);
      return;
    }
    // over a card — find its column
    const col = findStatus(overId);
    setOverStatus(col);
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    setOverStatus(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target status
    const targetStatus =
      STATUS_ORDER.find((s) => s === overId) ?? findStatus(overId);

    if (!targetStatus) return;

    const sourceStatus = findStatus(activeId);
    if (!sourceStatus || sourceStatus === targetStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus } : t))
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .eq("id", activeId);

    if (error) {
      toast.error("Failed to update task status.");
      // Rollback
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

  // ── render ────────────────────────────────────────────────────────────────

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">TASK BOARD</h1>
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

      {/* Board */}
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

        {/* Ghost card while dragging */}
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
