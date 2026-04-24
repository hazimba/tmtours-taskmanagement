"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Task, TaskStatus, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOverdue, isDueSoon } from "@/components/shared/task-meta";

const STATUS_LABEL: Record<string, string> = {
  TODO: "To Do", IN_PROGRESS: "In Progress", REVIEW: "Review", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const STATUS_BADGE: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

export function RecentTasksList({ tasks, users }: { tasks: Task[]; users: Pick<User, "id" | "full_name">[] }) {
  const weekAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; }, []);

  const recent = useMemo(
    () =>
      tasks
        .filter((t) => new Date(t.created_at) >= weekAgo)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10),
    [tasks, weekAgo]
  );

  if (recent.length === 0)
    return <p className="text-sm text-muted-foreground text-center py-8">No tasks created this week.</p>;

  return (
    <div className="divide-y divide-border">
      {recent.map((task) => {
        const creator = users.find((u) => u.id === task.created_by);
        const overdue = isOverdue(task.due_date) && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
        const soon = isDueSoon(task.due_date) && !overdue && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
        return (
          <Link key={task.id} href={`/task/${task.id}`} className="flex items-center gap-3 px-1 py-2.5 hover:bg-muted/50 rounded-lg transition-colors group">
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate group-hover:text-primary transition-colors", task.status === TaskStatus.COMPLETED && "line-through text-muted-foreground")}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {creator && <span className="text-[11px] text-muted-foreground">{creator.full_name}</span>}
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />{fmtDate(task.created_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {overdue && <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-500"><AlertCircle className="h-3 w-3" />Overdue</span>}
              {soon && <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500"><Clock className="h-3 w-3" />Due soon</span>}
              <Badge className={cn("text-[10px] px-1.5 py-0.5 rounded-sm font-medium", STATUS_BADGE[task.status])}>
                {STATUS_LABEL[task.status] ?? task.status}
              </Badge>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
