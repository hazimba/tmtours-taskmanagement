import { createClient } from "@/lib/supabase/server";
import { Profile, Task, TaskStatus } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TaskStatusPie,
  RecentTasksList,
  OverdueBarChart,
} from "@/components/home-charts";
import { CheckCircle2, ListTodo, AlertCircle, Clock } from "lucide-react";
import { getActiveCompanyId } from "@/lib/get-active-company";

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

const HomePage = async () => {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

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

  const totalActive = tasks.filter(
    (t) =>
      t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
  ).length;

  const totalCompleted = tasks.filter(
    (t) => t.status === TaskStatus.COMPLETED
  ).length;

  const totalOverdue = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < now &&
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED
  ).length;

  const totalDueSoon = tasks.filter((t) => {
    if (!t.due_date) return false;
    const diff =
      (new Date(t.due_date).getTime() - nowMs) / (1000 * 60 * 60 * 24);
    return (
      diff >= 0 &&
      diff <= 7 &&
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED
    );
  }).length;

  return (
    <div className="space-y-6 pb-6 mx-1">
      {/* ── heading ── */}
      <div>
        <h1 className="text-xl font-bold tracking-widest">DASHBOARD</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overview of all tasks
        </p>
      </div>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Tasks"
          value={totalActive}
          icon={ListTodo}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="Completed"
          value={totalCompleted}
          icon={CheckCircle2}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Overdue"
          value={totalOverdue}
          icon={AlertCircle}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatCard
          label="Due This Week"
          value={totalDueSoon}
          icon={Clock}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Tasks Created This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RecentTasksList tasks={tasks} users={users} />
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
