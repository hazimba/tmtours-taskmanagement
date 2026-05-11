"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TaskActivity, ActivityType, ActivityAction } from "@/app/types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ActivityFeedProps {
  companyId: string | null;
}

function activityLabel(activity: TaskActivity): string {
  const name =
    (activity.user as { full_name?: string } | null)?.full_name ?? "Someone";
  const taskTitle =
    (activity.task as { title?: string } | null)?.title ?? "a task";

  switch (activity.type) {
    case ActivityType.CREATED:
      return `${name} created "${taskTitle}"`;
    case ActivityType.COMMENT:
      return activity.action === ActivityAction.ADDED
        ? `${name} commented on "${taskTitle}"`
        : `${name} deleted a comment on "${taskTitle}"`;
    case ActivityType.ATTACHMENT:
      return activity.action === ActivityAction.ADDED
        ? `${name} attached a file to "${taskTitle}"`
        : `${name} removed an attachment from "${taskTitle}"`;
    case ActivityType.STATUS_CHANGE: {
      const nv = activity.new_value as { status?: string } | null;
      return `${name} changed status of "${taskTitle}" to ${
        nv?.status ?? "unknown"
      }`;
    }
    case ActivityType.PRIORITY_CHANGE: {
      const nv = activity.new_value as { priority?: string } | null;
      return `${name} changed priority of "${taskTitle}" to ${
        nv?.priority ?? "unknown"
      }`;
    }
    case ActivityType.ASSIGNEE_CHANGE: {
      const nv = activity.new_value as {
        full_name?: string | null;
        assigned_to?: string | null;
      } | null;
      if (nv?.full_name)
        return `${name} assigned "${taskTitle}" to ${nv.full_name}`;
      if (nv?.assigned_to) return `${name} changed assignee of "${taskTitle}"`;
      return `${name} unassigned "${taskTitle}"`;
    }
    case ActivityType.CYCLE_CHANGE: {
      const nv = activity.new_value as { name?: string } | null;
      return nv?.name
        ? `${name} moved "${taskTitle}" to cycle "${nv.name}"`
        : `${name} removed "${taskTitle}" from its cycle`;
    }
    case ActivityType.DEPARTMENT_CHANGE: {
      const nv = activity.new_value as { name?: string } | null;
      return nv?.name
        ? `${name} set department of "${taskTitle}" to ${nv.name}`
        : `${name} cleared department on "${taskTitle}"`;
    }
    case ActivityType.DUE_DATE_CHANGE: {
      const nv = activity.new_value as { due_date?: string } | null;
      return nv?.due_date
        ? `${name} set due date of "${taskTitle}" to ${new Date(
            nv.due_date
          ).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
        : `${name} cleared due date on "${taskTitle}"`;
    }
    case ActivityType.TITLE_CHANGE:
      return `${name} renamed a task to "${
        (activity.new_value as { title?: string } | null)?.title ?? taskTitle
      }"`;
    case ActivityType.DESCRIPTION_CHANGE:
      return `${name} updated description of "${taskTitle}"`;
    case ActivityType.TAG_CHANGE:
      return `${name} updated tags on "${taskTitle}"`;
    case ActivityType.PARENT_CHANGE: {
      const nv = activity.new_value as {
        parent_id?: string | null;
        title?: string | null;
      } | null;
      if (nv?.title)
        return `${name} set "${taskTitle}" as subtask of "${nv.title}"`;
      if (nv?.parent_id)
        return `${name} linked "${taskTitle}" to a parent task`;
      return `${name} removed parent task from "${taskTitle}"`;
    }
    default:
      return `${name} updated "${taskTitle}"`;
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_DOT: Partial<Record<ActivityType, string>> = {
  [ActivityType.CREATED]: "bg-green-500",
  [ActivityType.COMMENT]: "bg-blue-500",
  [ActivityType.ATTACHMENT]: "bg-purple-500",
  [ActivityType.STATUS_CHANGE]: "bg-amber-500",
  [ActivityType.PRIORITY_CHANGE]: "bg-orange-500",
  [ActivityType.ASSIGNEE_CHANGE]: "bg-cyan-500",
  [ActivityType.PARENT_CHANGE]: "bg-indigo-500",
};

const SELECT = `
  id, type, action, new_value, old_value, metadata, created_at, task_id,
  user:profiles!user_id(id, full_name, avatar_url),
  task:tasks!task_id(id, title)
`;

export function ActivityFeed({ companyId }: ActivityFeedProps) {
  const [supabase] = useState(() => createClient());
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let query = supabase
        .from("task_activities")
        .select(SELECT)
        .order("created_at", { ascending: false })
        .limit(20);

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data } = await query;

      if (!cancelled && data) {
        setActivities(data as unknown as TaskActivity[]);
        setLoading(false);
      }
    };

    load();

    const channelName = `task-activities-feed:${
      companyId ?? "all"
    }:${crypto.randomUUID()}`;

    const channel = supabase.channel(channelName);

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "task_activities",
        filter: companyId ? `company_id=eq.${companyId}` : undefined,
      },
      async (payload) => {
        const { data } = await supabase
          .from("task_activities")
          .select(SELECT)
          .eq("id", payload.new.id)
          .single();

        if (data && !cancelled) {
          setActivities((prev) =>
            [data as unknown as TaskActivity, ...prev].slice(0, 20)
          );
        }
      }
    );

    channel.subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-3 h-full overflow-y-auto scrollbar-hide">
      {activities.map((a) => {
        const dot = TYPE_DOT[a.type] ?? "bg-slate-400";
        const taskId = (a.task as { id?: string } | null)?.id;
        return (
          <div key={a.id} className="flex gap-2.5 items-start">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot)} />
            <div className="flex-1 min-w-0">
              {taskId ? (
                <Link
                  href={`/task/${taskId}`}
                  className="text-[11px] leading-snug text-foreground hover:text-primary transition-colors line-clamp-2"
                >
                  {activityLabel(a)}
                </Link>
              ) : (
                <p className="text-[11px] leading-snug text-foreground line-clamp-2">
                  {activityLabel(a)}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {timeAgo(a.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
