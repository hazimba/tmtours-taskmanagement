"use client";

import { useState, useTransition } from "react";
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
  AlertTriangle,
  MoveRight,
  Inbox,
  Loader2,
  List,
  Check,
  X,
  Zap,
  ZapOff,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

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
  [CycleStatus.NOT_ACTIVE]: {
    label: "Not Active",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    icon: <Clock className="h-3 w-3" />,
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

function isAtRisk(task: Task, cycle: Cycle | null) {
  if (!cycle?.end_date || !task.due_date) return false;
  return new Date(task.due_date) > new Date(cycle.end_date);
}

const BACKLOG_ID = "__backlog__";

function MoveToMenu({
  task,
  cycles,
  onMoved,
}: {
  task: Task;
  cycles: Cycle[];
  onMoved: (taskId: string, newCycleId: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();

  async function moveTo(targetCycleId: string | null) {
    startTransition(async () => {
      const { error } = await supabase
        .from("tasks")
        .update({
          cycle_id: targetCycleId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);
      if (error) {
        toast.error("Failed to move task.");
      } else {
        const name = targetCycleId
          ? cycles.find((c) => c.id === targetCycleId)?.name
          : null;
        toast.success(name ? `Moved to ${name}` : "Moved to Backlog");
        onMoved(task.id, targetCycleId);
      }
    });
  }

  const otherCycles = cycles.filter((c) => c.id !== task.cycle_id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.preventDefault()}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Move to…"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <List className="h-3.5 w-3.5" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Move to…
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {task.cycle_id !== null && (
          <DropdownMenuItem onClick={() => moveTo(null)}>
            <Inbox className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            Backlog
          </DropdownMenuItem>
        )}
        {otherCycles.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => moveTo(c.id)}>
            <CalendarRange className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            {c.name}
          </DropdownMenuItem>
        ))}
        {otherCycles.length === 0 && task.cycle_id === null && (
          <DropdownMenuItem disabled>No cycles available</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TaskRow({
  task,
  cycles,
  selectedCycle,
  onMoved,
  selected,
  onToggleSelect,
}: {
  task: Task;
  cycles: Cycle[];
  selectedCycle: Cycle | null;
  onMoved: (taskId: string, newCycleId: string | null) => void;
  selected: boolean;
  onToggleSelect: (taskId: string) => void;
}) {
  const statusCfg = TASK_STATUS_CONFIG[task.status];
  const atRisk = isAtRisk(task, selectedCycle);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-4 py-3.5 transition-all duration-200 group",
        selected
          ? "border-primary bg-primary/5"
          : atRisk
          ? "border-orange-300 dark:border-orange-700/60"
          : "hover:border-primary/30 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleSelect(task.id);
          }}
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors flex items-center justify-center",
            selected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary"
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </button>
        <div className="mt-0.5">{PRIORITY_ICONS[task.priority]}</div>
        <div className="flex-1 min-w-0">
          <Link href={`/task/${task.id}`}>
            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {task.title}
            </p>
          </Link>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
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
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px]",
                  atRisk
                    ? "text-orange-500 font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <AlertCircle className="h-3 w-3" />
                Due {formatDate(task.due_date)}
              </span>
            )}
            {atRisk && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Exceeds sprint
              </span>
            )}
            {task.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <MoveToMenu task={task} cycles={cycles} onMoved={onMoved} />
        <Link href={`/task/${task.id}`}>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}

export function CycleView({
  cycles: initialCycles,
  tasks: initialTasks,
}: CycleViewProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(
    initialCycles[0]?.id ?? BACKLOG_ID
  );
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  // Bulk selection
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();
  const [activatingId, setActivatingId] = useState<string | null>(null);

  function handleMoved(taskId: string, newCycleId: string | null) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, cycle_id: newCycleId } : t))
    );
  }

  function toggleCheck(taskId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  function toggleAll() {
    if (checkedIds.size === displayedTasks.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(displayedTasks.map((t) => t.id)));
    }
  }

  function clearSelection() {
    setCheckedIds(new Set());
  }

  async function toggleActive(cycleId: string) {
    const target = cycles.find((c) => c.id === cycleId);
    if (!target) return;

    const isAlreadyActive = target.status === CycleStatus.ACTIVE;
    const currentActive = cycles.find(
      (c) => c.status === CycleStatus.ACTIVE && c.id !== cycleId
    );

    setActivatingId(cycleId);

    try {
      if (isAlreadyActive) {
        // Deactivate → NOT_ACTIVE
        const { error } = await supabase
          .from("cycles")
          .update({
            status: CycleStatus.NOT_ACTIVE,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cycleId);
        if (error) throw error;
        setCycles((prev) =>
          prev.map((c) =>
            c.id === cycleId ? { ...c, status: CycleStatus.NOT_ACTIVE } : c
          )
        );
        toast.success(`"${target.name}" deactivated`);
      } else {
        // Deactivate the currently active cycle first (if any)
        if (currentActive) {
          const { error } = await supabase
            .from("cycles")
            .update({
              status: CycleStatus.NOT_ACTIVE,
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentActive.id);
          if (error) throw error;
        }
        // Activate the target cycle
        const { error } = await supabase
          .from("cycles")
          .update({
            status: CycleStatus.ACTIVE,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cycleId);
        if (error) throw error;

        setCycles((prev) =>
          prev.map((c) => {
            if (c.id === cycleId) return { ...c, status: CycleStatus.ACTIVE };
            if (c.status === CycleStatus.ACTIVE)
              return { ...c, status: CycleStatus.NOT_ACTIVE };
            return c;
          })
        );
        toast.success(`"${target.name}" is now the active cycle`);
      }
    } catch {
      toast.error("Failed to update cycle status.");
    } finally {
      setActivatingId(null);
    }
  }

  async function bulkMoveTo(targetCycleId: string | null) {
    const ids = [...checkedIds];
    startBulkTransition(async () => {
      const { error } = await supabase
        .from("tasks")
        .update({
          cycle_id: targetCycleId,
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);
      if (error) {
        toast.error("Bulk move failed.");
      } else {
        const name = targetCycleId
          ? cycles.find((c) => c.id === targetCycleId)?.name
          : null;
        toast.success(
          `${ids.length} task${ids.length > 1 ? "s" : ""} moved to ${
            name ?? "Backlog"
          }`
        );
        setTasks((prev) =>
          prev.map((t) =>
            checkedIds.has(t.id) ? { ...t, cycle_id: targetCycleId } : t
          )
        );
        setCheckedIds(new Set());
      }
    });
  }

  const isBacklog = selectedId === BACKLOG_ID;
  const selectedCycle = !isBacklog
    ? cycles.find((c) => c.id === selectedId) ?? null
    : null;
  const displayedTasks = isBacklog
    ? tasks.filter((t) => !t.cycle_id)
    : tasks.filter((t) => t.cycle_id === selectedId);
  const completedCount = displayedTasks.filter(
    (t) => t.status === TaskStatus.COMPLETED
  ).length;
  const progress =
    displayedTasks.length > 0
      ? Math.round((completedCount / displayedTasks.length) * 100)
      : 0;
  const atRiskCount = selectedCycle
    ? displayedTasks.filter((t) => isAtRisk(t, selectedCycle)).length
    : 0;
  const backlogCount = tasks.filter((t) => !t.cycle_id).length;

  const allChecked =
    displayedTasks.length > 0 && checkedIds.size === displayedTasks.length;
  const someChecked = checkedIds.size > 0 && !allChecked;
  const bulkTargets = cycles.filter((c) => c.id !== selectedId);

  // Reset selection when switching panels
  function selectPanel(id: string) {
    setSelectedId(id);
    setCheckedIds(new Set());
  }

  return (
    <div className="flex flex-col h-full gap-0">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-widest">CYCLES</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your sprints and work cycles
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/cycle/create")}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Cycle
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-screen md:min-h-0">
        {/* Left: Cycle list */}
        <aside className="md:w-3/10 shrink-0 flex flex-col gap-2">
          {/* Backlog pinned at top */}
          <button
            onClick={() => selectPanel(BACKLOG_ID)}
            className={cn(
              "w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-200 group",
              isBacklog
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Inbox
                  className={cn(
                    "h-4 w-4",
                    isBacklog ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isBacklog ? "text-primary" : "text-foreground"
                  )}
                >
                  Backlog
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {backlogCount}
                </span>
                <ListTodo className="h-3.5 w-3.5 text-muted-foreground/60" />
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-opacity",
                    isBacklog
                      ? "text-primary opacity-100"
                      : "opacity-0 group-hover:opacity-50"
                  )}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Tasks not assigned to any sprint
            </p>
          </button>

          {cycles.length > 0 && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 pt-1">
              Sprints
            </p>
          )}

          {cycles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2 rounded-xl border border-dashed">
              <CalendarRange className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No cycles yet</p>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7"
                onClick={() => router.push("/cycle/create")}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create cycle
              </Button>
            </div>
          ) : (
            cycles.map((cycle) => {
              const cfg = STATUS_CONFIG[cycle.status];
              const cycleTaskCount = tasks.filter(
                (t) => t.cycle_id === cycle.id
              ).length;
              const cycleAtRisk = tasks.filter(
                (t) => t.cycle_id === cycle.id && isAtRisk(t, cycle)
              ).length;
              const isSelected = selectedId === cycle.id;
              const isActive = cycle.status === CycleStatus.ACTIVE;
              const isToggling = activatingId === cycle.id;

              return (
                <div
                  key={cycle.id}
                  className={cn(
                    "group flex flex-col gap-3 rounded-xl border p-4 transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-md"
                  )}
                >
                  {/* Header: Status and Toggle Action */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                          cfg.color
                        )}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActive(cycle.id);
                      }}
                      disabled={isToggling}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                        isActive
                          ? "bg-green-500 text-white shadow-sm hidden"
                          : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                      )}
                    >
                      {isToggling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isActive ? (
                        <></>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5" />
                          Activate
                        </>
                      )}
                    </button>
                  </div>

                  {/* Main Content: Clickable Area for Selection */}
                  <button
                    onClick={() => selectPanel(cycle.id)}
                    className="flex flex-col items-start text-left group/content"
                  >
                    <h3
                      className={cn(
                        "text-base font-semibold leading-none transition-colors",
                        isSelected
                          ? "text-primary"
                          : "text-foreground group-hover/content:text-primary"
                      )}
                    >
                      {cycle.name}
                    </h3>

                    {(cycle.start_date || cycle.end_date) && (
                      <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(cycle.start_date)} —{" "}
                        {formatDate(cycle.end_date) ?? "Open Ended"}
                      </p>
                    )}
                  </button>

                  {/* Footer: Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <ListTodo className="h-4 w-4 text-muted-foreground/70" />
                        <span className="text-xs font-medium text-foreground">
                          {cycleTaskCount}{" "}
                          <span className="text-muted-foreground font-normal text-[11px]">
                            tasks
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {cycleAtRisk > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full border border-orange-200/50 dark:border-orange-800/50">
                          <AlertTriangle className="h-3 w-3" />
                          {cycleAtRisk} At Risk
                        </span>
                      )}
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isSelected
                            ? "text-primary translate-x-1"
                            : "text-muted-foreground opacity-0 group-hover:opacity-100"
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Right: Tasks panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="rounded-xl border bg-card px-5 py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                {isBacklog ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Inbox className="h-5 w-5 text-muted-foreground" />
                      <h2 className="text-lg font-bold">Backlog</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tasks not yet in a sprint. Use{" "}
                      <MoveRight className="inline h-3.5 w-3.5 mx-0.5" /> on any
                      task to assign it to a sprint.
                    </p>
                  </>
                ) : selectedCycle ? (
                  <>
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
                    {atRiskCount > 0 && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                          <strong>
                            {atRiskCount} task{atRiskCount > 1 ? "s" : ""}
                          </strong>{" "}
                          have due dates beyond the sprint end. Use{" "}
                          <MoveRight className="inline h-3 w-3 mx-0.5" /> to
                          move them to a future sprint or the backlog.
                        </span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={
                    isBacklog
                      ? `/task/create`
                      : `/task/create?cycle_id=${selectedCycle?.id}`
                  }
                >
                  <Button size="sm" variant="outline">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Task
                  </Button>
                </Link>
                {!isBacklog && selectedCycle && (
                  <Link href={`/cycle/${selectedCycle.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {!isBacklog && displayedTasks.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>
                    {completedCount} / {displayedTasks.length} tasks completed
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

          {displayedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed text-center gap-2">
              <ListTodo className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {isBacklog
                  ? "Backlog is empty — all tasks are in sprints"
                  : "No tasks linked to this cycle yet"}
              </p>
              <Link
                href={
                  isBacklog
                    ? `/task/create`
                    : `/task/create?cycle_id=${selectedCycle?.id}`
                }
              >
                <Button size="sm" variant="outline">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto relative">
              {/* Select-all row */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-muted/40">
                <button
                  onClick={toggleAll}
                  className={cn(
                    "h-4 w-4 shrink-0 rounded border transition-colors flex items-center justify-center",
                    allChecked
                      ? "bg-primary border-primary text-primary-foreground"
                      : someChecked
                      ? "bg-primary/40 border-primary"
                      : "border-muted-foreground/40 hover:border-primary"
                  )}
                >
                  {(allChecked || someChecked) && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </button>
                <span className="text-xs text-muted-foreground">
                  {checkedIds.size > 0
                    ? `${checkedIds.size} of ${displayedTasks.length} selected`
                    : `${displayedTasks.length} task${
                        displayedTasks.length !== 1 ? "s" : ""
                      }`}
                </span>
              </div>

              {displayedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  cycles={cycles}
                  selectedCycle={selectedCycle}
                  onMoved={handleMoved}
                  selected={checkedIds.has(task.id)}
                  onToggleSelect={toggleCheck}
                />
              ))}

              {/* Floating bulk action bar */}
              {checkedIds.size > 0 && (
                <div className="sticky bottom-2 z-10 mx-auto flex items-center gap-2 rounded-xl border bg-card shadow-lg px-4 py-3 flex-wrap">
                  <span className="text-sm font-medium text-foreground mr-1">
                    {checkedIds.size} selected
                  </span>
                  <div className="h-4 w-px bg-border mx-1" />

                  {/* Move to backlog */}
                  {!isBacklog && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkPending}
                      onClick={() => bulkMoveTo(null)}
                    >
                      {bulkPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Inbox className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Move to Backlog
                    </Button>
                  )}

                  {/* Move to other cycles */}
                  {bulkTargets.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={bulkPending}
                        >
                          {bulkPending ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <MoveRight className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Move to Sprint…
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          Move {checkedIds.size} task
                          {checkedIds.size > 1 ? "s" : ""} to…
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {bulkTargets.map((c) => (
                          <DropdownMenuItem
                            key={c.id}
                            onClick={() => bulkMoveTo(c.id)}
                          >
                            <CalendarRange className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            {c.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-muted-foreground"
                    onClick={clearSelection}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
