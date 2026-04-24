"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskStatus, TaskPriority, User } from "@/types";
import { STATUS_META, PRIORITY_META } from "@/components/shared/task-meta";

type SortField = "created_at" | "due_date" | "priority" | "title" | "status";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterStatus: string;
  onFilterStatus: (v: string) => void;
  filterPriority: string;
  onFilterPriority: (v: string) => void;
  filterAssignee: string;
  onFilterAssignee: (v: string) => void;
  filterDue: string;
  onFilterDue: (v: string) => void;
  filterParentOnly: boolean;
  onFilterParentOnly: (v: boolean) => void;
  filterHasSubtasks: boolean;
  onFilterHasSubtasks: (v: boolean) => void;
  users: Pick<User, "id" | "full_name">[];
  activeFilterCount: number;
  onClearFilters: () => void;
}

export function TaskFilters({
  search,
  onSearchChange,
  filterStatus,
  onFilterStatus,
  filterPriority,
  onFilterPriority,
  filterAssignee,
  onFilterAssignee,
  filterDue,
  onFilterDue,
  filterParentOnly,
  onFilterParentOnly,
  filterHasSubtasks,
  onFilterHasSubtasks,
  users,
  activeFilterCount,
  onClearFilters,
}: TaskFiltersProps) {
  return (
    <>
      {/* Search bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks, tags, descriptions…"
          className="pl-9 h-9 text-sm bg-white dark:bg-card"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between h-5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Filters
          </span>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onClearFilters}
            >
              <X className="h-3 w-3 mr-1" /> Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <Select value={filterStatus} onValueChange={onFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <SelectItem key={v} value={v}>
                    <span className={cn("flex items-center gap-1.5", m.color)}>{m.icon} {m.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
            <Select value={filterPriority} onValueChange={onFilterPriority}>
              <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="All priorities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {Object.entries(PRIORITY_META).map(([v, m]) => (
                  <SelectItem key={v} value={v}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee</label>
            <Select value={filterAssignee} onValueChange={onFilterAssignee}>
              <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="All assignees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
            <Select value={filterDue} onValueChange={onFilterDue}>
              <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Any due date" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any due date</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="this_week">Due within 1 week</SelectItem>
                <SelectItem value="no_date">No due date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subtask toggles */}
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterParentOnly}
              onChange={(e) => onFilterParentOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-xs font-medium text-foreground">Main tasks only</span>
            <span className="text-[10px] text-muted-foreground">(no parent)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterHasSubtasks}
              onChange={(e) => onFilterHasSubtasks(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-xs font-medium text-foreground">Has subtasks</span>
            <span className="text-[10px] text-muted-foreground">(parent tasks only)</span>
          </label>
        </div>
      </div>

      {/* Active filter badges (shown when panel is closed — kept for future use) */}
      {activeFilterCount > 0 && (
        <div className="hidden flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          {filterStatus !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {STATUS_META[filterStatus as TaskStatus]?.label}
              <button onClick={() => onFilterStatus("all")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {filterPriority !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {PRIORITY_META[filterPriority as TaskPriority]?.label}
              <button onClick={() => onFilterPriority("all")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {filterAssignee !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filterAssignee === "unassigned" ? "Unassigned" : users.find((u) => u.id === filterAssignee)?.full_name}
              <button onClick={() => onFilterAssignee("all")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {filterDue !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filterDue === "overdue" ? "Overdue" : filterDue === "this_week" ? "Due within 1 week" : "No due date"}
              <button onClick={() => onFilterDue("all")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>
      )}
    </>
  );
}
