import { Profile, Task, TaskStatus } from "@/app/types";
import { OverdueBarChart, TaskStatusPie } from "@/components/home-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { createClient } from "@/lib/supabase/server";
import { AlertCircle, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { RecentTasksFilterCard } from "./RecentTasksFilterCard";
import StatCardStatModal from "./StatCardStatModal";

// ─── page ─────────────────────────────────────────────────────────────────────

const HomePage = async () => {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  console.log("currentUser:", currentUser);

  const meta = currentUser?.user_metadata as Record<string, string> | undefined;
  const activeCompanyId = await getActiveCompanyId(meta);

  const tasksQuery = supabase
    .from("tasks")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const usersQuery = supabase
    .from("profiles")
    .select("id, full_name, avatar_url");

  if (activeCompanyId) {
    tasksQuery.eq("company_id", activeCompanyId);
    usersQuery.eq("company_id", activeCompanyId);
  }

  const [{ data: rawTasks }, { data: rawUsers }] = await Promise.all([
    tasksQuery,
    usersQuery,
  ]);

  const tasks = (rawTasks ?? []) as Task[];
  const users = (rawUsers ?? []) as Pick<
    Profile,
    "id" | "full_name" | "avatar_url"
  >[];

  const now = new Date();
  const nowMs = now.getTime();

  const isActiveTask = (t: Task) =>
    t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED;

  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // Sunday = 0
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const endOfWeek = (date: Date) => {
    const d = startOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const isDueBetween = (task: Task, start: Date, end: Date) => {
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    return due >= start && due <= end;
  };

  const thisWeekStart = startOfWeek(now);
  const thisWeekEnd = endOfWeek(now);

  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const nextWeekEnd = new Date(thisWeekEnd);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  const activeTasks = tasks.filter(isActiveTask);

  const thisWeekTasks = activeTasks.filter((t) =>
    isDueBetween(t, thisWeekStart, thisWeekEnd)
  );

  const nextWeekTasks = activeTasks.filter((t) =>
    isDueBetween(t, nextWeekStart, nextWeekEnd)
  );

  const toTaskItem = (t: Task) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date ?? undefined,
    assigned_to: users.find((u) => u.id === t.assigned_to),
  });

  const totalActive = tasks.filter(
    (t) =>
      t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
  );

  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);

  const overdueTasks = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < now &&
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED
  );

  const dueSoonTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    const diff =
      (new Date(t.due_date).getTime() - nowMs) / (1000 * 60 * 60 * 24);
    return (
      diff >= 0 &&
      diff <= 7 &&
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED
    );
  });

  const totalCompleted = completedTasks.length;
  const totalOverdue = overdueTasks.length;
  const totalDueSoon = dueSoonTasks.length;

  return (
    <div className="space-y-6 pb-6 mx-1">
      {/* ── heading ── */}
      <div>
        <h1 className="text-xl font-bold tracking-widest">DASHBOARD</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overview of all tasks
        </p>
      </div>
      <div className="text-sm text-muted-foreground">Your Tasks</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCardStatModal
          label="Active Tasks"
          value={
            totalActive.filter((t) => t.assigned_to === currentUser?.id).length
          }
          data={[
            {
              label: "Task List This Week",
              items: thisWeekTasks
                .map(toTaskItem)
                .filter((t) => t.assigned_to?.id === currentUser?.id),
            },
            {
              label: "Task List Next Week",
              items: nextWeekTasks
                .map(toTaskItem)
                .filter((t) => t.assigned_to?.id === currentUser?.id),
            },
            {
              label: "Task List All Active",
              items: activeTasks
                .map(toTaskItem)
                .filter((t) => t.assigned_to?.id === currentUser?.id),
            },
          ]}
          icon={<ListTodo className="size-5 hover:text-white " />}
          color="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light "
        />

        <StatCardStatModal
          label="Completed"
          value={totalCompleted}
          icon={<CheckCircle2 className="size-5" />}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          data={[
            {
              label: "Completed by You",
              items: completedTasks
                .filter(
                  (t) =>
                    t.assigned_to === currentUser?.id ||
                    t.created_by === currentUser?.id
                )
                .map(toTaskItem),
            },
          ]}
        />
        <StatCardStatModal
          label="Overdue"
          value={totalOverdue}
          icon={<AlertCircle className="size-5" />}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          data={[
            {
              label: "Overdue Assigned to You",
              items: overdueTasks
                .filter((t) => t.assigned_to === currentUser?.id)
                .map(toTaskItem),
            },
          ]}
        />
        <StatCardStatModal
          label="Due This Week"
          value={totalDueSoon}
          icon={<Clock className="size-5" />}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          data={[
            {
              label: "Due This Week Assigned to You",
              items: dueSoonTasks
                .filter((t) => t.assigned_to === currentUser?.id)
                .map(toTaskItem),
            },
          ]}
        />
      </div>

      {/* ── charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Tasks by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TaskStatusPie tasks={tasks} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Overdue &amp; Due Soon — by User
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 overflow-x-auto">
            <OverdueBarChart tasks={tasks} users={users} />
          </CardContent>
        </Card>
      </div>

      {/* ── recent tasks ── */}
      <RecentTasksFilterCard tasks={tasks} users={users} />
    </div>
  );
};

export default HomePage;
