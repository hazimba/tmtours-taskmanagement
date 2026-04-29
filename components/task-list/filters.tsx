"use client";

import { Profile, TaskPriority, TaskStatus } from "@/app/types";
import { PRIORITY_META, STATUS_META } from "@/components/shared/task-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search, X } from "lucide-react";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterStatus: string[];
  onFilterStatus: (v: string[]) => void;
  filterPriority: string[];
  onFilterPriority: (v: string[]) => void;
  filterAssignee: string[];
  onFilterAssignee: (v: string[]) => void;
  filterDue: string;
  onFilterDue: (v: string) => void;
  filterParentOnly: boolean;
  onFilterParentOnly: (v: boolean) => void;
  filterHasSubtasks: boolean;
  onFilterHasSubtasks: (v: boolean) => void;
  users: Pick<Profile, "id" | "full_name">[];
  activeFilterCount: number;
  onClearFilters: () => void;
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
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

        {/* Status — multi-select dropdown */}
        <div className="space-y-3">
          {/* Row: Status, Assignee, Due Date */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </label>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-8 w-full items-center justify-between rounded-md border px-3 text-xs hover:cursor-pointer",
                      filterStatus.length > 0
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>
                      {filterStatus.length > 0
                        ? `${filterStatus.length} selected`
                        : "All statuses"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-48 p-1.5 z-[10000]" align="start">
                  {Object.entries(STATUS_META).map(([v, m]) => {
                    const active = filterStatus.includes(v);

                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onFilterStatus(toggle(filterStatus, v))}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs",
                          active
                            ? "bg-muted font-medium"
                            : "text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        <span
                          className={cn(
                            "flex flex-1 items-center gap-1.5",
                            m.color
                          )}
                        >
                          {m.icon}
                          {m.label}
                        </span>
                        {active && <Check className="h-3 w-3 text-primary" />}
                      </button>
                    );
                  })}

                  {filterStatus.length > 0 && (
                    <>
                      <div className="my-1 border-t" />
                      <button
                        type="button"
                        onClick={() => onFilterStatus([])}
                        className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/60"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assignee
              </label>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-8 w-full items-center justify-between rounded-md border px-3 text-xs hover:cursor-pointer",
                      filterAssignee.length > 0
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>
                      {filterAssignee.length > 0
                        ? `${filterAssignee.length} selected`
                        : "All assignees"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-52 p-1.5 z-[10000]" align="start">
                  {[
                    { id: "unassigned", full_name: "Unassigned" },
                    ...users,
                  ].map((u) => {
                    const active = filterAssignee.includes(u.id);

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() =>
                          onFilterAssignee(toggle(filterAssignee, u.id))
                        }
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs",
                          active
                            ? "bg-muted font-medium"
                            : "text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        <span className="flex-1 truncate text-left">
                          {u.full_name ?? "Unknown"}
                        </span>
                        {active && <Check className="h-3 w-3 text-primary" />}
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Due Date
              </label>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-8 w-full items-center justify-between rounded-md border px-3 text-xs hover:cursor-pointer",
                      filterDue !== "all"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>
                      {filterDue === "all" && "Any due date"}
                      {filterDue === "overdue" && "Overdue"}
                      {filterDue === "this_week" && "Due within 1 week"}
                      {filterDue === "no_date" && "No due date"}
                    </span>

                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-48 p-1.5 z-[10000]" align="start">
                  {[
                    { value: "all", label: "Any due date" },
                    { value: "overdue", label: "Overdue" },
                    { value: "this_week", label: "Due within 1 week" },
                    { value: "no_date", label: "No due date" },
                  ].map((item) => {
                    const active = filterDue === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => onFilterDue(item.value)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs",
                          active
                            ? "bg-muted font-medium"
                            : "text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        <span>{item.label}</span>
                        {active && <Check className="h-3 w-3 text-primary" />}
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Priority — smaller */}
          <div className="flex flex-col md:flex-col flex-1 gap-3 ">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Priority
              </label>

              <div className="flex flex-wrap gap-3">
                {Object.entries(PRIORITY_META).map(([v, m]) => {
                  const active = filterPriority.includes(v);

                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        onFilterPriority(toggle(filterPriority, v))
                      }
                      className={cn(
                        "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-all hover:cursor-pointer",
                        active
                          ? `${m.className} border-transparent`
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {m.icon}
                      {m.label}
                      {active && <X className="h-2.5 w-2.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Task Type
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onFilterParentOnly(!filterParentOnly)}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-all hover:cursor-pointer",
                    filterParentOnly
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  Main tasks only
                  {filterParentOnly && <X className="h-2.5 w-2.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => onFilterHasSubtasks(!filterHasSubtasks)}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-all hover:cursor-pointer",
                    filterHasSubtasks
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  Has subtasks
                  {filterHasSubtasks && <X className="h-2.5 w-2.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subtask toggles */}
      </div>

      {/* Active filter summary badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          {filterStatus.map((s) => (
            <Badge key={s} className="gap-1 text-xs">
              <span className={cn("flex items-center gap-1")}>
                {STATUS_META[s as TaskStatus]?.icon}
                {STATUS_META[s as TaskStatus]?.label}
              </span>
              <button
                onClick={() =>
                  onFilterStatus(filterStatus.filter((v) => v !== s))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filterPriority.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1 text-xs">
              <span className={cn("flex items-center gap-1")}>
                {PRIORITY_META[p as TaskPriority]?.icon}
                {PRIORITY_META[p as TaskPriority]?.label}
              </span>
              <button
                onClick={() =>
                  onFilterPriority(filterPriority.filter((v) => v !== p))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filterAssignee.map((a) => (
            <Badge key={a} variant="secondary" className="gap-1 text-xs">
              {a === "unassigned"
                ? "Unassigned"
                : users.find((u) => u.id === a)?.full_name ?? a}
              <button
                onClick={() =>
                  onFilterAssignee(filterAssignee.filter((v) => v !== a))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filterDue !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filterDue === "overdue"
                ? "Overdue"
                : filterDue === "this_week"
                ? "Due within 1 week"
                : "No due date"}
              <button onClick={() => onFilterDue("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </>
  );
}
