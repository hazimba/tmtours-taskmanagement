"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Task, TaskStatus, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CalendarDays, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function isOverdue(d?: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

function isDueSoon(d?: string | null) {
  if (!d) return false;
  const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
  });
}

// ─── Status Pie ──────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  REVIEW: "#f59e0b",
  COMPLETED: "#10b981",
  CANCELLED: "#f87171",
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function TaskStatusPie({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([status, value]) => ({
        name: STATUS_LABEL[status] ?? status,
        value,
        status,
      }))
      .sort((a, b) => b.value - a.value);
  }, [tasks]);

  if (data.length === 0)
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No tasks yet.
      </p>
    );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLOR[entry.status] ?? "#94a3b8"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Recent Tasks list ────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  REVIEW:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  COMPLETED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
};

export function RecentTasksList({
  tasks,
  users,
}: {
  tasks: Task[];
  users: Pick<User, "id" | "full_name">[];
}) {
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const recent = useMemo(
    () =>
      tasks
        .filter((t) => new Date(t.created_at) >= weekAgo)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 10),
    [tasks, weekAgo]
  );

  if (recent.length === 0)
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No tasks created this week.
      </p>
    );

  return (
    <div className="divide-y divide-border">
      {recent.map((task) => {
        const creator = users.find((u) => u.id === task.created_by);
        const overdue =
          isOverdue(task.due_date) &&
          task.status !== TaskStatus.COMPLETED &&
          task.status !== TaskStatus.CANCELLED;
        const soon =
          isDueSoon(task.due_date) &&
          !overdue &&
          task.status !== TaskStatus.COMPLETED &&
          task.status !== TaskStatus.CANCELLED;

        return (
          <Link
            key={task.id}
            href={`/task/${task.id}`}
            className="flex items-center gap-3 px-1 py-2.5 hover:bg-muted/50 rounded-lg transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate group-hover:text-primary transition-colors",
                  task.status === TaskStatus.COMPLETED &&
                    "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {creator && (
                  <span className="text-[11px] text-muted-foreground">
                    {creator.full_name}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {fmtDate(task.created_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {overdue && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </span>
              )}
              {soon && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500">
                  <Clock className="h-3 w-3" />
                  Due soon
                </span>
              )}
              <Badge
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-sm font-medium",
                  STATUS_BADGE[task.status]
                )}
              >
                {STATUS_LABEL[task.status] ?? task.status}
              </Badge>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Overdue Bar Chart ────────────────────────────────────────────────────────

interface OverdueBarProps {
  tasks: Task[];
  users: Pick<User, "id" | "full_name">[];
}

export function OverdueBarChart({ tasks, users }: OverdueBarProps) {
  const data = useMemo(() => {
    const map: Record<string, { name: string; overdue: number; soon: number }> =
      {};

    for (const t of tasks) {
      if (
        t.status === TaskStatus.COMPLETED ||
        t.status === TaskStatus.CANCELLED
      )
        continue;

      const userId = t.assigned_to ?? t.created_by;
      const user = users.find((u) => u.id === userId);
      const name = user?.full_name ?? "Unassigned";

      if (!map[userId]) map[userId] = { name, overdue: 0, soon: 0 };

      if (isOverdue(t.due_date)) map[userId].overdue += 1;
      else if (isDueSoon(t.due_date)) map[userId].soon += 1;
    }

    return Object.values(map)
      .filter((d) => d.overdue > 0 || d.soon > 0)
      .sort((a, b) => b.overdue + b.soon - (a.overdue + a.soon))
      .slice(0, 10);
  }, [tasks, users]);

  if (data.length === 0)
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No overdue or upcoming tasks. 🎉
      </p>
    );

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="var(--border)"
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.05)" }}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>}
        />
        <Bar
          dataKey="overdue"
          name="Overdue"
          fill="#f87171"
          radius={[0, 4, 4, 0]}
          stackId="a"
        />
        <Bar
          dataKey="soon"
          name="Due Soon"
          fill="#fbbf24"
          radius={[0, 4, 4, 0]}
          stackId="a"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
