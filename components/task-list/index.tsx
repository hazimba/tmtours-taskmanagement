"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Task, TaskPriority, TaskStatus, User } from "@/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isOverdue,
  isDueSoonWithinWeek,
  PRIORITY_ORDER,
} from "@/components/shared/task-meta";
import { TaskFilters } from "./filters";
import { TaskTable, SortField, SortDir } from "./table";
import { Pagination } from "./pagination";

const PAGE_SIZE = 20;

interface TaskListViewProps {
  initialTasks: Task[];
  users: Pick<User, "id" | "full_name" | "avatar_url">[];
  currentUser?: User | null;
}

export function TaskListView({
  initialTasks,
  users,
  currentUser,
}: TaskListViewProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState(
    currentUser ? currentUser.id : "all"
  );
  const [filterDue, setFilterDue] = useState("all");
  const [filterParentOnly, setFilterParentOnly] = useState(false);
  const [filterHasSubtasks, setFilterHasSubtasks] = useState(false);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const parentIds = new Set(
      initialTasks.map((t) => t.parent_id).filter(Boolean)
    );
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
    if (filterAssignee === "unassigned")
      list = list.filter((t) => !t.assigned_to);
    else if (filterAssignee !== "all")
      list = list.filter((t) => t.assigned_to === filterAssignee);

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

    if (filterParentOnly) list = list.filter((t) => !t.parent_id);
    if (filterHasSubtasks) list = list.filter((t) => parentIds.has(t.id));

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
    filterParentOnly,
    filterHasSubtasks,
    sortField,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount = [
    filterPriority !== "all",
    filterAssignee !== "all",
    filterDue !== "all",
    filterParentOnly,
    filterHasSubtasks,
  ].filter(Boolean).length;

  function clearFilters() {
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterAssignee("all");
    setFilterDue("all");
    setFilterParentOnly(false);
    setFilterHasSubtasks(false);
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-4 scrollbar-hide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-widest">TASKS LIST</h1>
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

      {/* Filters */}
      <TaskFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        filterStatus={filterStatus}
        onFilterStatus={(v) => {
          setFilterStatus(v);
          setPage(1);
        }}
        filterPriority={filterPriority}
        onFilterPriority={(v) => {
          setFilterPriority(v);
          setPage(1);
        }}
        filterAssignee={filterAssignee}
        onFilterAssignee={(v) => {
          setFilterAssignee(v);
          setPage(1);
        }}
        filterDue={filterDue}
        onFilterDue={(v) => {
          setFilterDue(v);
          setPage(1);
        }}
        filterParentOnly={filterParentOnly}
        onFilterParentOnly={(v) => {
          setFilterParentOnly(v);
          setPage(1);
        }}
        filterHasSubtasks={filterHasSubtasks}
        onFilterHasSubtasks={(v) => {
          setFilterHasSubtasks(v);
          setPage(1);
        }}
        users={users}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />

      {/* Table */}
      <TaskTable
        tasks={paged}
        allCount={filtered.length}
        users={users}
        sortField={sortField}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        onSetSortField={setSortField}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        search={search}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
}
