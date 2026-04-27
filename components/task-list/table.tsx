"use client";

import { Task, TaskStatus, Profile } from "@/app/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  X,
  AlertCircle,
  Paperclip,
  CalendarDays,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_META,
  PRIORITY_META,
  isOverdue,
  isDueSoonWithinWeek,
  formatDate,
} from "@/components/shared/task-meta";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type SortField =
  | "created_at"
  | "due_date"
  | "priority"
  | "title"
  | "status";
export type SortDir = "asc" | "desc";

export function SortIcon({
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

interface TaskTableProps {
  tasks: Task[];
  allCount: number;
  users: Pick<Profile, "id" | "full_name" | "avatar_url">[];
  sortField: SortField;
  sortDir: SortDir;
  onToggleSort: (f: SortField) => void;
  onSetSortField: (f: SortField) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
  search: string;
}

export function TaskTable({
  tasks,
  allCount,
  users,
  sortField,
  sortDir,
  onToggleSort,
  onSetSortField,
  activeFilterCount,
  onClearFilters,
  search,
}: TaskTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-card">
      {/* Desktop column headers */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_160px_110px_140px_120px] bg-muted/50 border-b border-border px-4 py-2.5">
        {(
          [
            ["title", "Task"],
            ["status", "Status"],
            ["priority", "Priority"],
            ["due_date", "Due Date"],
            ["created_at", "Created"],
          ] as [SortField, string][]
        ).map(([field, label]) => (
          <button
            key={field}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground text-left"
            onClick={() => onToggleSort(field)}
          >
            {label} <SortIcon field={field} active={sortField} dir={sortDir} />
          </button>
        ))}
      </div>

      {/* Mobile header */}
      <div className="sm:hidden flex items-center justify-between bg-muted/50 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {allCount} tasks
        </span>
        <Select
          value={sortField}
          onValueChange={(v) => onSetSortField(v as SortField)}
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
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <Search className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            No tasks match your filters
          </p>
          {(activeFilterCount > 0 || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {tasks.map((task) => {
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
            const isLoading = loadingId === task.id;

            return (
              <div
                key={task.id}
                onClick={() => {
                  if (loadingId) return;
                  setLoadingId(task.id);
                  router.push(`/task/${task.id}`);
                }}
                className="flex sm:grid sm:grid-cols-[1fr_160px_110px_140px_120px_40px] px-4 py-3 hover:bg-muted/40 transition-colors items-center gap-3 sm:gap-0 group cursor-pointer"
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
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={assignee.avatar_url || ""} />
                          <AvatarFallback className="rounded-full bg-primary/20 text-primary text-[9px] font-bold inline-flex items-center justify-center shrink-0">
                            {assignee.full_name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-muted-foreground">
                          {assignee.full_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        Unassigned
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
                    {/* @ts-expect-error - attachments is JSONB array of { url: string, name: string } */}
                    {(task.attachments?.length ?? 0) > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Paperclip className="h-2.5 w-2.5" />
                        {/* @ts-expect-error - attachments is JSONB array of { url: string, name: string } */}
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
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </div>

                {/* Created at — desktop */}
                <div className="hidden sm:flex items-center">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(task.created_at)}
                  </span>
                </div>

                {/* Mobile: status icon */}
                <span
                  className={cn(
                    "flex sm:hidden items-center shrink-0",
                    statusMeta.color
                  )}
                >
                  {statusMeta.icon}
                </span>

                {/* Loading spinner */}
                <div className="flex items-center justify-end">
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
