"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Task, TaskStatus, Profile } from "@/app/types";
import { isOverdue, isDueSoon } from "@/components/shared/task-meta";

interface OverdueBarProps {
  tasks: Task[];
  users: Pick<Profile, "id" | "full_name">[];
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
