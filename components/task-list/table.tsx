"use client";

import { Profile, Task, TaskStatus } from "@/app/types";
import {
  PRIORITY_META,
  STATUS_META,
  formatDate,
  isDueSoonWithinWeek,
  isOverdue,
} from "@/components/shared/task-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Loader2,
  Paperclip,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AvatarNameRender from "../avatar-name-render";

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
      <div className="hidden md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(90px,0.8fr)_minmax(70px,0.6fr)_minmax(90px,0.7fr)_minmax(90px,0.7fr)] bg-muted/50 border-b border-border px-4 py-2.5">
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
      <div className="md:hidden flex items-center justify-between bg-muted/50 border-b border-border px-4 py-2">
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
                className={cn(
                  "relative grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.8fr)_minmax(90px,0.8fr)_minmax(70px,0.6fr)_minmax(90px,0.7fr)_minmax(90px,0.7fr)]",
                  "px-4 py-3 items-center gap-3 cursor-pointer group transition-colors hover:bg-muted/40",
                  isLoading && "bg-muted/60 pointer-events-none"
                )}
              >
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/50 backdrop-blur-[1px]">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}

                <div className="min-w-0 sm:pr-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm font-medium leading-snug group-hover:text-primary transition-colors",
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

                  <div className="mt-0.5 flex items-center gap-2 min-w-0 overflow-hidden">
                    {assignee ? (
                      // <div className="flex min-w-0 items-center gap-2">
                      //   <Avatar className="h-6 w-6 shrink-0">
                      //     <AvatarImage src={assignee.avatar_url || ""} />
                      //     <AvatarFallback className="rounded-full bg-primary/20 text-primary text-[9px] font-bold">
                      //       {assignee.full_name?.charAt(0).toUpperCase()}
                      //     </AvatarFallback>
                      //   </Avatar>

                      //   <span className="truncate text-[11px] text-muted-foreground">
                      //     {assignee.full_name}
                      //   </span>
                      // </div>
                      <AvatarNameRender assignee={assignee as Profile} />
                    ) : (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        Unassigned
                      </span>
                    )}

                    {task.tags?.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        className="shrink-0 max-w-24 truncate text-[10px] bg-accent text-accent-foreground px-2 rounded-sm py-0.5 font-medium"
                      >
                        {tag}
                      </Badge>
                    ))}

                    {/* @ts-expect-error - attachments is JSONB array */}
                    {(task.attachments?.length ?? 0) > 0 && (
                      <span className="shrink-0 text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Paperclip className="h-2.5 w-2.5" />
                        {/* @ts-expect-error - attachments is JSONB array */}
                        {task.attachments.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden md:flex min-w-0 items-center">
                  <span
                    className={cn(
                      "min-w-0 truncate text-xs font-medium",
                      statusMeta.color
                    )}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="hidden md:flex min-w-0 items-center">
                  <Badge
                    className={cn(
                      "min-w-0 max-w-full truncate text-xs font-semibold px-2 py-0.5 rounded-sm",
                      priorityMeta.className
                    )}
                  >
                    <span className="block truncate">{priorityMeta.label}</span>
                  </Badge>
                </div>

                {/* Due date */}
                <div className="hidden md:flex min-w-0 items-center">
                  {task.due_date ? (
                    <span
                      className={cn(
                        "min-w-0 truncate text-xs font-medium",
                        overdue
                          ? "text-red-500"
                          : dueSoon
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDate(task.due_date)}
                    </span>
                  ) : (
                    <span className="truncate text-xs text-muted-foreground/40">
                      —
                    </span>
                  )}
                </div>

                {/* Created at */}
                <div className="hidden md:flex min-w-0 items-center">
                  <span className="min-w-0 truncate text-xs text-muted-foreground">
                    {formatDate(task.created_at)}
                  </span>
                </div>

                <span
                  className={cn(
                    "flex md:hidden items-center justify-end shrink-0",
                    statusMeta.color
                  )}
                >
                  {statusMeta.icon}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
