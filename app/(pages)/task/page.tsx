import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createClient as clientServer } from "@/lib/supabase/server";
import { Task, TaskStatus } from "@/types";
import { TaskCard } from "@/components/task-card";
import {
  CircleDashed,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ClipboardList,
} from "lucide-react";

const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

const STATUS_LABELS: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  [TaskStatus.TODO]: {
    label: "To Do",
    icon: <CircleDashed className="h-4 w-4" />,
    color: "text-slate-500",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: <CircleDot className="h-4 w-4" />,
    color: "text-blue-500",
  },
  [TaskStatus.REVIEW]: {
    label: "Review",
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-500",
  },
  [TaskStatus.COMPLETED]: {
    label: "Completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-500",
  },
  [TaskStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-400",
  },
};

const TaskPage = async () => {
  const supabase = await createClient();
  const supabaseServer = await clientServer();

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">Task Management</h1>
        <p className="text-red-500">Failed to load tasks. Please try again.</p>
      </div>
    );
  }

  const grouped = STATUS_ORDER.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = (tasks ?? []).filter((t: Task) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  const totalActive = (tasks ?? []).filter(
    (t: Task) =>
      t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
  ).length;

  return (
    <div className="">
      <div className="backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalActive} active task{totalActive !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/task/create">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 space-y-8">
        {(tasks ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="rounded-full p-5">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-base">No tasks yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first task to get started
              </p>
            </div>
            <Link href="/task/create">
              <Button className="gap-2 mt-2">
                <Plus className="h-4 w-4" />
                Add New Task
              </Button>
            </Link>
          </div>
        ) : (
          STATUS_ORDER.map((status) => {
            const group = grouped[status];
            if (group.length === 0) return null;
            const cfg = STATUS_LABELS[status];
            return (
              <section key={status}>
                <div className={`flex items-center gap-2 mb-3 ${cfg.color}`}>
                  {cfg.icon}
                  <h2 className="text-sm font-semibold">{cfg.label}</h2>
                  <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
                    {group.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.map((task: Task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};
export default TaskPage;
