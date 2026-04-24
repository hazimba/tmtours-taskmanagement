"use client";

import { Task, TaskStatus, TaskPriority } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STATUS_META, PRIORITY_META } from "@/components/shared/task-meta";

const PRIORITIES = [TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];
const STATUSES = Object.values(TaskStatus);

export function BoardPanel({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority × Status</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No tasks yet.</p>
        )}
        {PRIORITIES.map((priority) => {
          const pm = PRIORITY_META[priority];
          const pt = tasks.filter((t) => t.priority === priority);
          if (pt.length === 0) return null;
          return (
            <div key={priority}>
              <div className={cn("flex items-center gap-1.5 text-xs font-semibold mb-1.5", pm.color)}>
                {pm.icon} {pm.label}
                <span className="ml-auto text-muted-foreground font-normal">{pt.length}</span>
              </div>
              <div className="space-y-1">
                {STATUSES.map((status) => {
                  const count = pt.filter((t) => t.status === status).length;
                  if (count === 0) return null;
                  const sm = STATUS_META[status];
                  return (
                    <div key={status} className="flex items-center justify-between pl-3">
                      <span className={cn("text-[11px] flex items-center gap-1", sm.color)}>{sm.icon} {sm.label}</span>
                      <span className={cn("text-[11px] font-semibold px-1.5 rounded", sm.bg, sm.color)}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
