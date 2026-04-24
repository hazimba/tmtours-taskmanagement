"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Task, TaskPriority, TaskStatus, User } from "@/types";
import {
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CalendarDays,
  AlertCircle,
  Paperclip,
  CircleDashed,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── config ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  [TaskStatus.TODO]: {
    label: "To Do",
    icon: <CircleDashed className="h-3.5 w-3.5" />,
    color: "text-slate-500",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: <CircleDot className="h-3.5 w-3.5" />,
    color: "text-blue-500",
  },
  [TaskStatus.REVIEW]: {
    label: "Review",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-amber-500",
  },
  [TaskStatus.COMPLETED]: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-emerald-500",
  },
  [TaskStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "text-red-400",
  },
};

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  [TaskPriority.LOW]: {
    label: "Low",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  [TaskPriority.MEDIUM]: {
    label: "Medium",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  [TaskPriority.HIGH]: {
    label: "High",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  [TaskPriority.URGENT]: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
};

type SortField = "created_at" | "due_date" | "priority" | "title" | "status";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  [TaskPriority.URGENT]: 4,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.LOW]: 1,
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(dateStr?: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isDueSoonWithinWeek(dateStr?: string | null) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

// ─── SortIcon — must be outside component ────────────────────────────────────

function SortIcon({
  field,
  active,
  dir,
}: {
  field: SortField;
  active: SortField;
  dir: SortDir;
}) {
  if (active !== field)
    return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return dir === "asc" ? (
    <ChevronUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 text-primary" />
  );
}

// ─── component ────────────────────────────────────────────────────────────────

interface TaskListViewProps {
  initialTasks: Task[];
  users: Pick<User, "id" | "full_name" | "avatar_url">[];
}

export function TaskListView({ initialTasks, users }: TaskListViewProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterDue, setFilterDue] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(true);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    let list = [...initialTasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (filterStatus !== "all")
      list = list.filter((t) => t.status === filterStatus);
    if (filterPriority !== "all")
      list = list.filter((t) => t.priority === filterPriority);

    if (filterAssignee === "unassigned") {
      list = list.filter((t) => !t.assigned_to);
    } else if (filterAssignee !== "all") {
      list = list.filter((t) => t.assigned_to === filterAssignee);
    }

    if (filterDue === "overdue") {
      list = list.filter(
        (t) =>
          isOverdue(t.due_date) &&
          t.status !== TaskStatus.COMPLETED &&
          t.status !== TaskStatus.CANCELLED
      );
    } else if (filterDue === "this_week") {
      list = list.filter(
        (t) =>
          isDueSoonWithinWeek(t.due_date) &&
          t.status !== TaskStatus.COMPLETED &&
          t.status !== TaskStatus.CANCELLED
      );
    } else if (filterDue === "no_date") {
      list = list.filter((t) => !t.due_date);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "created_at":
          cmp =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "due_date":
          cmp =
            (a.due_date ? new Date(a.due_date).getTime() : Infinity) -
            (b.due_date ? new Date(b.due_date).getTime() : Infinity);
          break;
        case "priority":
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [
    initialTasks,
    search,
    filterStatus,
    filterPriority,
    filterAssignee,
    filterDue,
    sortField,
    sortDir,
  ]);

  const activeFilterCount = [
    filterStatus !== "all",
    filterPriority !== "all",
    filterAssignee !== "all",
    filterDue !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterAssignee("all");
    setFilterDue("all");
    setSearch("");
  }

  return (
    <div className="space-y-4 scrollbar-hide">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 scrollbar-hide">
        <div>
          <h1 className="text-xl font-bold tracking-tight">TASKS LIST</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} of {initialTasks.length} tasks
          </p>
        </div>
        <Link href="/task/create">
          <Button size="sm" className="gap-2 h-8">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </Link>
      </div>

      {/* ── Search + filter toggle ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, tags, descriptions…"
            className="pl-9 h-9 text-sm bg-white dark:bg-card"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          className="h-9 gap-2 shrink-0"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 h-5 w-5 rounded-full bg-white/20 text-[11px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(STATUS_META).map(([v, m]) => (
                    <SelectItem key={v} value={v}>
                      <span
                        className={cn("flex items-center gap-1.5", m.color)}
                      >
                        {m.icon} {m.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Priority
              </label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {Object.entries(PRIORITY_META).map(([v, m]) => (
                    <SelectItem key={v} value={v}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assignee
              </label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Due Date
              </label>
              <Select value={filterDue} onValueChange={setFilterDue}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Any due date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any due date</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="this_week">Due within 1 week</SelectItem>
                  <SelectItem value="no_date">No due date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Active filter badges ── */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          {filterStatus !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {STATUS_META[filterStatus as TaskStatus]?.label}
              <button onClick={() => setFilterStatus("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filterPriority !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {PRIORITY_META[filterPriority as TaskPriority]?.label}
              <button onClick={() => setFilterPriority("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filterAssignee !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filterAssignee === "unassigned"
                ? "Unassigned"
                : users.find((u) => u.id === filterAssignee)?.full_name}
              <button onClick={() => setFilterAssignee("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filterDue !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filterDue === "overdue"
                ? "Overdue"
                : filterDue === "this_week"
                ? "Due within 1 week"
                : "No due date"}
              <button onClick={() => setFilterDue("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-card">
        {/* Desktop column headers */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_160px_110px_140px_120px] bg-muted/50 border-b border-border px-4 py-2.5">
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground text-left"
            onClick={() => toggleSort("title")}
          >
            Task <SortIcon field="title" active={sortField} dir={sortDir} />
          </button>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => toggleSort("status")}
          >
            Status <SortIcon field="status" active={sortField} dir={sortDir} />
          </button>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => toggleSort("priority")}
          >
            Priority{" "}
            <SortIcon field="priority" active={sortField} dir={sortDir} />
          </button>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => toggleSort("due_date")}
          >
            Due Date{" "}
            <SortIcon field="due_date" active={sortField} dir={sortDir} />
          </button>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => toggleSort("created_at")}
          >
            Created{" "}
            <SortIcon field="created_at" active={sortField} dir={sortDir} />
          </button>
        </div>

        {/* Mobile header */}
        <div className="sm:hidden flex items-center justify-between bg-muted/50 border-b border-border px-4 py-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {filtered.length} tasks
          </span>
          <Select
            value={sortField}
            onValueChange={(v) => setSortField(v as SortField)}
          >
            <SelectTrigger className="h-7 w-auto text-xs border-0 bg-transparent gap-1 pr-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Sort: Created</SelectItem>
              <SelectItem value="due_date">Sort: Due Date</SelectItem>
              <SelectItem value="priority">Sort: Priority</SelectItem>
              <SelectItem value="title">Sort: Title</SelectItem>
              <SelectItem value="status">Sort: Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <Search className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              No tasks match your filters
            </p>
            {(activeFilterCount > 0 || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs gap-1"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((task) => {
              const overdue =
                isOverdue(task.due_date) &&
                task.status !== TaskStatus.COMPLETED &&
                task.status !== TaskStatus.CANCELLED;
              const dueSoon =
                isDueSoonWithinWeek(task.due_date) &&
                !overdue &&
                task.status !== TaskStatus.COMPLETED &&
                task.status !== TaskStatus.CANCELLED;
              const statusMeta = STATUS_META[task.status];
              const priorityMeta = PRIORITY_META[task.priority];
              const assignee = users.find((u) => u.id === task.assigned_to);

              return (
                <Link
                  key={task.id}
                  href={`/task/${task.id}`}
                  className="flex sm:grid sm:grid-cols-[1fr_160px_110px_140px_120px] px-4 py-3 hover:bg-muted/40 transition-colors items-center gap-3 sm:gap-0 group"
                >
                  {/* Title + sub-meta */}
                  <div className="flex-1 min-w-0 sm:pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-sm font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors",
                          task.status === TaskStatus.COMPLETED &&
                            "line-through text-muted-foreground group-hover:text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      {overdue && (
                        <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-red-500">
                          <AlertCircle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                      {dueSoon && (
                        <span className="shrink-0 text-[10px] font-semibold text-amber-500">
                          Due soon
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {assignee && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold inline-flex items-center justify-center shrink-0">
                            {assignee.full_name?.charAt(0).toUpperCase()}
                          </span>
                          {assignee.full_name}
                        </span>
                      )}
                      {task.tags?.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          className="text-[10px] bg-accent text-accent-foreground px-2 rounded-sm py-0.5 font-medium"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(task.attachments?.length ?? 0) > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Paperclip className="h-2.5 w-2.5" />
                          {task.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status — desktop */}
                  <div className="hidden sm:flex items-center">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium whitespace-nowrap",
                        statusMeta.color
                      )}
                    >
                      {statusMeta.icon}
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Priority — desktop */}
                  <div className="hidden sm:flex items-center">
                    <Badge
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-sm whitespace-nowrap",
                        priorityMeta.className
                      )}
                    >
                      {priorityMeta.label}
                    </Badge>
                  </div>

                  {/* Due date — desktop */}
                  <div className="hidden sm:flex items-center">
                    {task.due_date ? (
                      <span
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium whitespace-nowrap",
                          overdue
                            ? "text-red-500"
                            : dueSoon
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(task.due_date)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">
                        —
                      </span>
                    )}
                  </div>

                  {/* Created at — desktop */}
                  <div className="hidden sm:flex items-center">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(task.created_at)}
                    </span>
                  </div>

                  {/* Mobile: status icon only */}
                  <span
                    className={cn(
                      "flex sm:hidden items-center shrink-0",
                      statusMeta.color
                    )}
                  >
                    {statusMeta.icon}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
