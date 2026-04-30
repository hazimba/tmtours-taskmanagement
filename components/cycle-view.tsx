"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cycle,
  CycleStatus,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/app/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  CalendarRange,
  CheckCircle2,
  CircleDot,
  Clock,
  XCircle,
  PauseCircle,
  ChevronRight,
  ListTodo,
  AlertCircle,
  ArrowUpCircle,
  Flame,
} from "lucide-react";
import Link from "next/link";

interface CycleViewProps {
  cycles: Cycle[];
  tasks: Task[];
}

const STATUS_CONFIG: Record<
  CycleStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  [CycleStatus.PLANNED]: {
    label: "Planned",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <Clock className="h-3 w-3" />,
  },
  [CycleStatus.ACTIVE]: {
    label: "Active",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: <CircleDot className="h-3 w-3" />,
  },
  [CycleStatus.COMPLETED]: {
    label: "Completed",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  [CycleStatus.CANCELLED]: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="h-3 w-3" />,
  },
  [CycleStatus.ON_HOLD]: {
    label: "On Hold",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: <PauseCircle className="h-3 w-3" />,
  },
};

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> =
  {
    [TaskStatus.TODO]: {
      label: "To Do",
      color:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    [TaskStatus.IN_PROGRESS]: {
      label: "In Progress",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    [TaskStatus.REVIEW]: {
      label: "Review",
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    [TaskStatus.COMPLETED]: {
      label: "Done",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    [TaskStatus.CANCELLED]: {
      label: "Cancelled",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  };

const PRIORITY_ICONS: Record<TaskPriority, React.ReactNode> = {
  [TaskPriority.LOW]: (
    <ArrowUpCircle className="h-3.5 w-3.5 text-slate-400 rotate-180" />
  ),
  [TaskPriority.MEDIUM]: (
    <ArrowUpCircle className="h-3.5 w-3.5 text-blue-400" />
  ),
  [TaskPriority.HIGH]: (
    <ArrowUpCircle className="h-3.5 w-3.5 text-orange-500" />
  ),
  [TaskPriority.URGENT]: <Flame className="h-3.5 w-3.5 text-red-500" />,
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CycleView({ cycles, tasks }: CycleViewProps) {
  const router = useRouter();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(
    cycles[0]?.id ?? null
  );

  const selectedCycle = cycles.find((c) => c.id === selectedCycleId) ?? null;
  const cycleTasks = tasks.filter((t) => t.cycle_id === selectedCycleId);

  const completedCount = cycleTasks.filter(
    (t) => t.status === TaskStatus.COMPLETED
  ).length;
  const progress =
    cycleTasks.length > 0
      ? Math.round((completedCount / cycleTasks.length) * 100)
      : 0;

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Cycles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your sprints and work cycles
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/cycle/create")}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Cycle
        </Button>
      </div>

      {cycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
          <CalendarRange className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-muted-foreground">No cycles yet</p>
            <p className="text-sm text-muted-foreground/70">
              Create your first sprint or work cycle
            </p>
          </div>
          <Button size="sm" onClick={() => router.push("/cycle/create")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Cycle
          </Button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
          {/* Left — Cycle List */}
          <aside className="md:w-72 shrink-0 flex flex-col gap-2">
            {cycles.map((cycle) => {
              const cfg = STATUS_CONFIG[cycle.status];
              const cycleTaskCount = tasks.filter(
                (t) => t.cycle_id === cycle.id
              ).length;
              const isSelected = selectedCycleId === cycle.id;

              return (
                <button
                  key={cycle.id}
                  onClick={() => setSelectedCycleId(cycle.id)}
                  className={cn(
                    "w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-200 group",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            cfg.color
                          )}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          isSelected ? "text-primary" : "text-foreground"
                        )}
                      >
                        {cycle.name}
                      </p>
                      {(cycle.start_date || cycle.end_date) && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {formatDate(cycle.start_date)} →{" "}
                          {formatDate(cycle.end_date) ?? "No end date"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {cycleTaskCount}
                      </span>
                      <ListTodo className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-opacity",
                          isSelected
                            ? "text-primary opacity-100"
                            : "opacity-0 group-hover:opacity-50"
                        )}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Right — Tasks for selected cycle */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {selectedCycle ? (
              <>
                {/* Cycle header */}
                <div className="rounded-xl border bg-card px-5 py-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-lg font-bold truncate">
                          {selectedCycle.name}
                        </h2>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            STATUS_CONFIG[selectedCycle.status].color
                          )}
                        >
                          {STATUS_CONFIG[selectedCycle.status].icon}
                          {STATUS_CONFIG[selectedCycle.status].label}
                        </span>
                      </div>
                      {selectedCycle.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedCycle.description}
                        </p>
                      )}
                      {(selectedCycle.start_date || selectedCycle.end_date) && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CalendarRange className="h-3.5 w-3.5" />
                          {formatDate(selectedCycle.start_date) ??
                            "No start"} →{" "}
                          {formatDate(selectedCycle.end_date) ?? "No end"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/task/create?cycle_id=${selectedCycle.id}`}>
                        <Button size="sm" variant="outline">
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add Task
                        </Button>
                      </Link>
                      <Link href={`/cycle/${selectedCycle.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {cycleTasks.length > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>
                          {completedCount} / {cycleTasks.length} tasks completed
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tasks */}
                {cycleTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed text-center gap-2">
                    <ListTodo className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No tasks linked to this cycle yet
                    </p>
                    <Link href={`/task/create?cycle_id=${selectedCycle.id}`}>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add First Task
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto">
                    {cycleTasks.map((task) => {
                      const statusCfg = TASK_STATUS_CONFIG[task.status];
                      return (
                        <Link
                          key={task.id}
                          href={`/task/${task.id}`}
                          className="rounded-xl border bg-card px-4 py-3.5 hover:border-primary/30 hover:bg-muted/30 transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {PRIORITY_ICONS[task.priority]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                  {task.title}
                                </p>
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span
                                  className={cn(
                                    "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                                    statusCfg.color
                                  )}
                                >
                                  {statusCfg.label}
                                </span>
                                {task.due_date && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <AlertCircle className="h-3 w-3" />
                                    Due {formatDate(task.due_date)}
                                  </span>
                                )}
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {task.tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-48 rounded-xl border border-dashed text-muted-foreground text-sm">
                Select a cycle to view its tasks
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
