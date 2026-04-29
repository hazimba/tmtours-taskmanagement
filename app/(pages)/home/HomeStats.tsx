"use client";

import { useState } from "react";
import { Task, Profile, TaskStatus } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ListTodo,
  Users,
  User,
} from "lucide-react";
import { TaskStatusPie } from "@/components/home-charts";
import { OverdueBarChart } from "@/components/home-charts";
import StatCardStatModal from "./StatCardStatModal";

type TaskItem = {
  id: string;
  title: string;
  due_date?: string;
  assigned_to?: {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
  };
};

interface HomeStatsProps {
  tasks: Task[];
  users: Pick<Profile, "id" | "full_name" | "avatar_url">[];
  currentUserId: string | null;
}

export function HomeStats({ tasks, users, currentUserId }: HomeStatsProps) {
  const [myTasksOnly, setMyTasksOnly] = useState(true);

  const now = new Date();
  const nowMs = now.getTime();

  const toTaskItem = (t: Task): TaskItem => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date ?? undefined,
    assigned_to: users.find((u) => u.id === t.assigned_to),
  });

  // Apply the toggle filter
  const viewTasks = myTasksOnly
    ? tasks.filter(
        (t) => t.assigned_to === currentUserId || t.created_by === currentUserId
      )
    : tasks;

  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const endOfWeek = (date: Date) => {
    const d = startOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  };
  const thisWeekStart = startOfWeek(now);
  const thisWeekEnd = endOfWeek(now);
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const nextWeekEnd = new Date(thisWeekEnd);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  const isActive = (t: Task) =>
    t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED;

  const isDueBetween = (t: Task, start: Date, end: Date) => {
    if (!t.due_date) return false;
    const due = new Date(t.due_date);
    return due >= start && due <= end;
  };

  const activeTasks = viewTasks.filter(isActive);
  const completedTasks = viewTasks.filter(
    (t) => t.status === TaskStatus.COMPLETED
  );
  const overdueTasks = viewTasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < now &&
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED
  );
  const dueSoonTasks = viewTasks.filter((t) => {
    if (!t.due_date) return false;
    const diff =
      (new Date(t.due_date).getTime() - nowMs) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7 && isActive(t);
  });

  const thisWeekTasks = activeTasks.filter((t) =>
    isDueBetween(t, thisWeekStart, thisWeekEnd)
  );
  const nextWeekTasks = activeTasks.filter((t) =>
    isDueBetween(t, nextWeekStart, nextWeekEnd)
  );

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        <button
          onClick={() => setMyTasksOnly(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            myTasksOnly
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          My Tasks
        </button>
        <button
          onClick={() => setMyTasksOnly(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            !myTasksOnly
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          All Team
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCardStatModal
          label="Active Tasks"
          value={activeTasks.length}
          icon={<ListTodo className="size-5" />}
          color="bg-primary/10 text-primary dark:bg-primary/20"
          data={[
            {
              label: "Due This Week",
              items: thisWeekTasks.map(toTaskItem),
            },
            {
              label: "Due Next Week",
              items: nextWeekTasks.map(toTaskItem),
            },
            {
              label: "All Active",
              items: activeTasks.map(toTaskItem),
            },
          ]}
        />
        <StatCardStatModal
          label="Completed"
          value={completedTasks.length}
          icon={<CheckCircle2 className="size-5" />}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          data={[
            { label: "Completed Tasks", items: completedTasks.map(toTaskItem) },
          ]}
        />
        <StatCardStatModal
          label="Overdue"
          value={overdueTasks.length}
          icon={<AlertCircle className="size-5" />}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          data={[
            { label: "Overdue Tasks", items: overdueTasks.map(toTaskItem) },
          ]}
        />
        <StatCardStatModal
          label="Due This Week"
          value={dueSoonTasks.length}
          icon={<Clock className="size-5" />}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          data={[
            { label: "Due Within 7 Days", items: dueSoonTasks.map(toTaskItem) },
          ]}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Tasks by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TaskStatusPie tasks={viewTasks} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Overdue &amp; Due Soon — by User
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 overflow-x-auto">
            <OverdueBarChart tasks={viewTasks} users={users} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
