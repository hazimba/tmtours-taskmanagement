"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Task } from "@/types";

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
    for (const t of tasks) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return Object.entries(counts)
      .map(([status, value]) => ({ name: STATUS_LABEL[status] ?? status, value, status }))
      .sort((a, b) => b.value - a.value);
  }, [tasks]);

  if (data.length === 0)
    return <p className="text-sm text-muted-foreground text-center py-8">No tasks yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }}
        />
        <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
