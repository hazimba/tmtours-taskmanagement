"use client";

import { Task, TaskPriority, TaskStatus } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_META,
  PRIORITY_META,
  isOverdue,
  isDueSoon,
} from "@/components/shared/task-meta";
import { ActivityFeed } from "./activity-feed";

interface ListPanelProps {
  tasks: Task[];
  currentUserId: string | null;
  companyId: string | null;
}

export function ListPanel({ tasks, currentUserId, companyId }: ListPanelProps) {
  const myTasks = currentUserId
    ? tasks.filter(
        (t) => t.assigned_to === currentUserId
        // || t.created_by === currentUserId
      )
    : [];

  const myOverdue = myTasks.filter(
    (t) =>
      isOverdue(t.due_date) &&
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED
  ).length;
  const mySoon = myTasks.filter(
    (t) =>
      isDueSoon(t.due_date) &&
      !isOverdue(t.due_date) &&
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED
  ).length;

  const myStatusCounts = Object.values(TaskStatus).map((s) => ({
    status: s,
    count: myTasks.filter((t) => t.status === s).length,
  }));
  const myPriorityCounts = Object.values(TaskPriority).map((p) => ({
    priority: p,
    count: myTasks.filter(
      (t) =>
        t.priority === p &&
        t.status !== TaskStatus.COMPLETED &&
        t.status !== TaskStatus.CANCELLED
    ).length,
  }));
  const tableStatusCounts = Object.values(TaskStatus).map((s) => ({
    status: s,
    count: tasks.filter((t) => t.status === s).length,
  }));

  return (
    <div className="space-y-3">
      {/* My Tasks */}
      <Card>
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {currentUserId ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-sm font-bold">{myTasks.length}</span>
              </div>
              {myOverdue > 0 && (
                <div className="flex justify-between items-center text-red-500">
                  <span className="text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Overdue
                  </span>
                  <span className="text-sm font-bold">{myOverdue}</span>
                </div>
              )}
              {mySoon > 0 && (
                <div className="flex justify-between items-center text-amber-500">
                  <span className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Due this week
                  </span>
                  <span className="text-sm font-bold">{mySoon}</span>
                </div>
              )}
              <div className="pt-2 space-y-1.5 border-t border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  By Status
                </p>
                {myStatusCounts
                  .filter((s) => s.count > 0)
                  .map(({ status, count }) => {
                    const m = STATUS_META[status];
                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <span
                          className={cn(
                            "text-[11px] flex items-center gap-1.5",
                            m.color
                          )}
                        >
                          {m.icon} {m.label}
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-semibold px-1.5 py-0.5 rounded",
                            m.bg,
                            m.color
                          )}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <div className="pt-2 space-y-1.5 border-t border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Active by Priority
                </p>
                {myPriorityCounts
                  .filter((p) => p.count > 0)
                  .map(({ priority, count }) => {
                    const m = PRIORITY_META[priority];
                    return (
                      <div
                        key={priority}
                        className="flex items-center justify-between"
                      >
                        <span
                          className={cn(
                            "text-[11px] flex items-center gap-1.5",
                            m.color
                          )}
                        >
                          {m.icon} {m.label}
                        </span>
                        <span className="text-[11px] font-semibold">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sign in to see your stats.
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Tasks */}
      <Card>
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            All Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-bold">{tasks.length}</span>
          </div>
          {tableStatusCounts
            .filter((s) => s.count > 0)
            .map(({ status, count }) => {
              const m = STATUS_META[status];
              const pct = tasks.length
                ? Math.round((count / tasks.length) * 100)
                : 0;
              return (
                <div key={status} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[11px] flex items-center gap-1.5",
                        m.color
                      )}
                    >
                      {m.icon} {m.label}
                    </span>
                    <span className="text-[11px] font-semibold">{count}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          status === TaskStatus.COMPLETED
                            ? "#10b981"
                            : status === TaskStatus.IN_PROGRESS
                            ? "#3b82f6"
                            : status === TaskStatus.REVIEW
                            ? "#f59e0b"
                            : status === TaskStatus.CANCELLED
                            ? "#f87171"
                            : "#94a3b8",
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="max-h-72 overflow-y-auto scrollbar-hide">
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 overflow-y-auto scrollbar-hide">
          <ActivityFeed companyId={companyId} />
        </CardContent>
      </Card>
    </div>
  );
}
