import Link from "next/link";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { Card } from "@/components/ui/card";
import {
  CalendarDays,
  AlertCircle,
  Clock,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  XCircle,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  [TaskPriority.LOW]: {
    label: "Low",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  [TaskPriority.MEDIUM]: {
    label: "Medium",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  [TaskPriority.HIGH]: {
    label: "High",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  [TaskPriority.URGENT]: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
};

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  [TaskStatus.TODO]: {
    label: "To Do",
    icon: <CircleDashed className="h-3.5 w-3.5" />,
    className: "text-slate-500",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: <CircleDot className="h-3.5 w-3.5" />,
    className: "text-blue-500",
  },
  [TaskStatus.REVIEW]: {
    label: "Review",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "text-amber-500",
  },
  [TaskStatus.COMPLETED]: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "text-emerald-500",
  },
  [TaskStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "text-red-400",
  },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isDueSoon(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 2 && diff >= 0;
}

function isOverdue(dateStr?: string) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const overdue =
    isOverdue(task.due_date) && task.status !== TaskStatus.COMPLETED;
  const dueSoon =
    isDueSoon(task.due_date) && task.status !== TaskStatus.COMPLETED;

  return (
    <Link href={`/task/${task.id}`}>
      <Card
        className={cn(
          "px-4 py-4 gap-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-primary/30 active:scale-[0.99]",
          task.status === TaskStatus.COMPLETED && "opacity-70"
        )}
      >
        {/* Top row: status + priority */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              status.className
            )}
          >
            {status.icon}
            {status.label}
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              priority.className
            )}
          >
            {priority.label}
          </span>
        </div>

        {/* Title */}
        <div className="px-0">
          <h3
            className={cn(
              "font-semibold text-sm leading-snug line-clamp-2",
              task.status === TaskStatus.COMPLETED &&
                "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 truncate">
              {task.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-0">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground px-1">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: due date + attachments */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60 px-0">
          <div className="flex items-center gap-1.5">
            {task.due_date ? (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  overdue
                    ? "text-red-500"
                    : dueSoon
                    ? "text-amber-500"
                    : "text-muted-foreground"
                )}
              >
                {overdue ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <CalendarDays className="h-3 w-3" />
                )}
                {overdue
                  ? `Overdue · ${formatDate(task.due_date)}`
                  : formatDate(task.due_date)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50">
                No due date
              </span>
            )}
          </div>

          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              {task.attachments.length}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
