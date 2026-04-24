import { createClient } from "@/lib/supabase/client";
import { createClient as clientServer } from "@/lib/supabase/server";
import { Task, TaskPriority, TaskStatus, User } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskComments } from "@/components/task-comments";
import { TaskCard } from "@/components/task-card";
import { TaskAttachmentModal } from "@/components/task-attachment-modal";
import { DeleteTaskButton } from "@/components/delete-task-button";
import {
  ArrowLeft,
  CalendarDays,
  CalendarCheck,
  User2,
  Tag,
  CircleDashed,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FolderOpen,
  Hash,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string; dot: string }
> = {
  [TaskPriority.LOW]: {
    label: "Low",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  [TaskPriority.MEDIUM]: {
    label: "Medium",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  [TaskPriority.HIGH]: {
    label: "High",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  [TaskPriority.URGENT]: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    dot: "bg-red-500",
  },
};

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  [TaskStatus.TODO]: {
    label: "To Do",
    icon: <CircleDashed className="h-4 w-4" />,
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: <CircleDot className="h-4 w-4" />,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/30",
  },
  [TaskStatus.REVIEW]: {
    label: "Review",
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/30",
  },
  [TaskStatus.COMPLETED]: {
    label: "Completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
  },
  [TaskStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-400",
    bg: "bg-red-50 dark:bg-red-900/30",
  },
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverdue(dateStr?: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

interface MetaRowProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function MetaRow({ icon, label, children }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex items-center gap-2 w-36 shrink-0 text-muted-foreground text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const supabaseServer = await clientServer();

  const {
    data: { user: currentUser },
  } = await supabaseServer.auth.getUser();

  const { data: task, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !task) return notFound();

  const typedTask = task as Task;
  const priority = priorityConfig[typedTask.priority];
  const status = statusConfig[typedTask.status];
  const overdue =
    isOverdue(typedTask.due_date) &&
    typedTask.status !== TaskStatus.COMPLETED &&
    typedTask.status !== TaskStatus.CANCELLED;
  const isOwner = currentUser?.id === typedTask.created_by;

  const [assignedUserRes, createdByUserRes, parentTaskRes, subtasksRes] =
    await Promise.all([
      typedTask.assigned_to
        ? supabase
            .from("profiles")
            .select("*")
            .eq("id", typedTask.assigned_to)
            .single()
        : Promise.resolve({ data: null }),
      typedTask.created_by
        ? supabase
            .from("profiles")
            .select("*")
            .eq("id", typedTask.created_by)
            .single()
        : Promise.resolve({ data: null }),
      typedTask.parent_id
        ? supabase
            .from("tasks")
            .select("*")
            .eq("id", typedTask.parent_id)
            .single()
        : Promise.resolve({ data: null }),
      supabase
        .from("tasks")
        .select("*")
        .eq("parent_id", id)
        .eq("is_archived", false),
    ]);

  const assignedUser = assignedUserRes.data as User | null;
  const createdByUser = createdByUserRes.data as User | null;
  const parentTask = parentTaskRes.data as Task | null;
  const subtasks = (subtasksRes.data ?? []) as Task[];

  console.log("createdByUser", createdByUser);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
      <Card className="scrollbar-hide overflow-y-auto p-4">
        <div className="space-y-5">
          <div className="flex pb-8 items-center justify-between gap-4">
            <Link href="/task">
              <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="">Tasks</span>
              </Button>
            </Link>
            {isOwner && (
              <div className="flex items-center gap-2">
                <Link href={`/task/${id}/edit`}>
                  <Button size="sm" variant="outline">
                    Edit Task
                  </Button>
                </Link>

                <DeleteTaskButton
                  task={typedTask}
                  subtaskCount={subtasks.length}
                />
              </div>
            )}
          </div>
          {parentTask && (
            <Link
              href={`/task/${parentTask.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Subtask of:{" "}
              <span className="underline underline-offset-2">
                {parentTask.title}
              </span>
            </Link>
          )}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                  status.bg,
                  status.color
                )}
              >
                {status.icon}
                {status.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                  priority.className
                )}
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", priority.dot)}
                />
                {priority.label} Priority
              </span>
              {overdue && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Overdue
                </span>
              )}
            </div>

            <h1
              className={cn(
                "text-2xl font-bold leading-snug tracking-tight",
                typedTask.status === TaskStatus.COMPLETED &&
                  "line-through text-muted-foreground"
              )}
            >
              {typedTask.title}
            </h1>
          </div>
          {typedTask.description && (
            <Card className="px-5 py-4 gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {typedTask.description}
              </p>
            </Card>
          )}
          <Card className="px-5 py-1 gap-0 divide-y divide-border/60">
            <MetaRow icon={<User2 className="h-4 w-4" />} label="Assigned To">
              {assignedUser ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={assignedUser.avatar_url || ""} />
                    <AvatarFallback className="text-[12px] font-bold">
                      {assignedUser.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <span>{assignedUser.full_name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </MetaRow>

            <MetaRow icon={<User2 className="h-4 w-4" />} label="Created By">
              {createdByUser ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={createdByUser.avatar_url || ""} />
                    <AvatarFallback className="text-[12px] font-bold bg-primary/50 text-white">
                      {createdByUser.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <span>{createdByUser.full_name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Unknown</span>
              )}
            </MetaRow>

            {typedTask.category && (
              <MetaRow
                icon={<FolderOpen className="h-4 w-4" />}
                label="Category"
              >
                <span className="capitalize">{typedTask.category}</span>
              </MetaRow>
            )}

            <MetaRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Start Date"
            >
              {typedTask.start_date ? (
                <span>{formatDate(typedTask.start_date)}</span>
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </MetaRow>

            <MetaRow
              icon={<CalendarCheck className="h-4 w-4" />}
              label="Due Date"
            >
              {typedTask.due_date ? (
                <span className={cn(overdue && "text-red-500 font-medium")}>
                  {formatDate(typedTask.due_date)}
                  {overdue && " · Overdue"}
                </span>
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </MetaRow>

            {typedTask.completed_at && (
              <MetaRow
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Completed"
              >
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatDate(typedTask.completed_at)}
                </span>
              </MetaRow>
            )}

            {typedTask.tags?.length > 0 && (
              <MetaRow icon={<Tag className="h-4 w-4" />} label="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {typedTask.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      <Hash className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </MetaRow>
            )}
          </Card>

          <TaskAttachmentModal
            taskId={id}
            currentUserId={currentUser?.id ?? null}
            assignedTo={typedTask.assigned_to ?? null}
            initialAttachments={typedTask.attachments ?? []}
          />

          {subtasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GitBranch className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Subtasks ({subtasks.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subtasks.map((sub) => (
                  <TaskCard key={sub.id} task={sub} />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-1 text-xs text-muted-foreground pt-2 pb-8">
            <span>Created {formatDateTime(typedTask.created_at)}</span>
            <span>Updated {formatDateTime(typedTask.updated_at)}</span>
          </div>
        </div>
      </Card>
      <Card className="px-5 py-5 gap-4">
        {currentUser ? (
          <TaskComments taskId={id} currentUserId={currentUser.id} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sign in to view and post comments.
          </p>
        )}
      </Card>
    </div>
  );
}
