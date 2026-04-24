"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskStatus, TaskPriority, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Flame,
  TrendingUp,
  Minus,
  ArrowDown,
} from "lucide-react";

function isOverdue(d?: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}
function isDueSoon(d?: string | null) {
  if (!d) return false;
  const diff = (new Date(d).getTime() - Date.now()) / 86400000;
  return diff >= 0 && diff <= 7;
}
function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const STATUS_META: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  [TaskStatus.TODO]: { label: "To Do", icon: <CircleDashed className="h-3.5 w-3.5" />, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" },
  [TaskStatus.IN_PROGRESS]: { label: "In Progress", icon: <CircleDot className="h-3.5 w-3.5" />, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  [TaskStatus.REVIEW]: { label: "Review", icon: <Clock className="h-3.5 w-3.5" />, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
  [TaskStatus.COMPLETED]: { label: "Completed", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  [TaskStatus.CANCELLED]: { label: "Cancelled", icon: <XCircle className="h-3.5 w-3.5" />, color: "text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
};

const PRIORITY_META: Record<TaskPriority, { label: string; icon: React.ReactNode; color: string }> = {
  [TaskPriority.URGENT]: { label: "Urgent", icon: <Flame className="h-3.5 w-3.5" />, color: "text-red-500" },
  [TaskPriority.HIGH]: { label: "High", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-orange-500" },
  [TaskPriority.MEDIUM]: { label: "Medium", icon: <Minus className="h-3.5 w-3.5" />, color: "text-blue-500" },
  [TaskPriority.LOW]: { label: "Low", icon: <ArrowDown className="h-3.5 w-3.5" />, color: "text-slate-400" },
};

// ─── Live Clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const time = now.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="rounded-xl bg-primary/10 p-3 text-center space-y-0.5">
      <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">{days[now.getDay()]}</p>
      <p className="text-xl font-bold tabular-nums text-foreground">{time}</p>
      <p className="text-[11px] text-muted-foreground">{date}</p>
    </div>
  );
}

// ─── Home panel ───────────────────────────────────────────────────────────────

function HomeSidebarPanel({ profile }: { profile: User | null }) {
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
          <Avatar className="h-14 w-14 mt-1">
            <AvatarImage src={profile?.avatar_url ?? ""} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-tight">{profile?.full_name ?? "—"}</p>
            {profile?.position && <p className="text-[11px] text-muted-foreground mt-0.5">{profile.position}</p>}
            {profile?.department && <p className="text-[11px] text-muted-foreground">{profile.department}</p>}
            {profile?.role && (
              <span className="inline-block mt-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {profile.role}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <LiveClock />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Task List panel ──────────────────────────────────────────────────────────

function TaskListSidebarPanel({ tasks, currentUserId }: { tasks: Task[]; currentUserId: string | null }) {
  const myTasks = currentUserId
    ? tasks.filter((t) => t.assigned_to === currentUserId || t.created_by === currentUserId)
    : [];

  const myOverdue = myTasks.filter((t) => isOverdue(t.due_date) && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length;
  const mySoon = myTasks.filter((t) => isDueSoon(t.due_date) && !isOverdue(t.due_date) && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length;

  const myStatusCounts = Object.values(TaskStatus).map((s) => ({ status: s, count: myTasks.filter((t) => t.status === s).length }));
  const myPriorityCounts = Object.values(TaskPriority).map((p) => ({ priority: p, count: myTasks.filter((t) => t.priority === p && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length }));
  const tableStatusCounts = Object.values(TaskStatus).map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }));

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Tasks</CardTitle>
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
                  <span className="text-xs flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Overdue</span>
                  <span className="text-sm font-bold">{myOverdue}</span>
                </div>
              )}
              {mySoon > 0 && (
                <div className="flex justify-between items-center text-amber-500">
                  <span className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Due this week</span>
                  <span className="text-sm font-bold">{mySoon}</span>
                </div>
              )}
              <div className="pt-2 space-y-1.5 border-t border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">By Status</p>
                {myStatusCounts.filter((s) => s.count > 0).map(({ status, count }) => {
                  const m = STATUS_META[status];
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className={cn("text-[11px] flex items-center gap-1.5", m.color)}>{m.icon} {m.label}</span>
                      <span className={cn("text-[11px] font-semibold px-1.5 py-0.5 rounded", m.bg, m.color)}>{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 space-y-1.5 border-t border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active by Priority</p>
                {myPriorityCounts.filter((p) => p.count > 0).map(({ priority, count }) => {
                  const m = PRIORITY_META[priority];
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <span className={cn("text-[11px] flex items-center gap-1.5", m.color)}>{m.icon} {m.label}</span>
                      <span className="text-[11px] font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sign in to see your stats.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Tasks</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-bold">{tasks.length}</span>
          </div>
          {tableStatusCounts.filter((s) => s.count > 0).map(({ status, count }) => {
            const m = STATUS_META[status];
            const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
            return (
              <div key={status} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className={cn("text-[11px] flex items-center gap-1.5", m.color)}>{m.icon} {m.label}</span>
                  <span className="text-[11px] font-semibold">{count}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: status === TaskStatus.COMPLETED ? "#10b981" : status === TaskStatus.IN_PROGRESS ? "#3b82f6" : status === TaskStatus.REVIEW ? "#f59e0b" : status === TaskStatus.CANCELLED ? "#f87171" : "#94a3b8" }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Task Board panel ─────────────────────────────────────────────────────────

function TaskBoardSidebarPanel({ tasks }: { tasks: Task[] }) {
  const statuses = Object.values(TaskStatus);
  const priorities = [TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority × Status</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {tasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No tasks yet.</p>}
        {priorities.map((priority) => {
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
                {statuses.map((status) => {
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

// ─── Profile panel ────────────────────────────────────────────────────────────

function ProfileSidebarPanel({ profile }: { profile: User | null }) {
  if (!profile) return null;
  const fields: { label: string; value: string | null | undefined }[] = [
    { label: "Full name", value: profile.full_name },
    { label: "Email", value: profile.email },
    { label: "Phone", value: profile.phone },
    { label: "Location", value: profile.location },
    { label: "Position", value: profile.position },
    { label: "Department", value: profile.department },
    { label: "Profile photo", value: profile.avatar_url },
  ];
  const missing = fields.filter((f) => !f.value);
  const filled = fields.filter((f) => !!f.value);
  const pct = Math.round((filled.length / fields.length) * 100);
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile Completeness</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{filled.length}/{fields.length} fields</span>
            <span className={cn("font-semibold", pct === 100 ? "text-emerald-500" : "text-amber-500")}>{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-amber-400")} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {missing.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Missing
            </p>
            {missing.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-500 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Profile complete!
          </p>
        )}
        <div className="space-y-1.5 border-t border-border pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Completed</p>
          {filled.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-[11px]">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              <span className="text-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SidebarPanel() {
  const pathname = usePathname();
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      const [{ data: tasksData }, { data: profileData }] = await Promise.all([
        supabase.from("tasks").select("*").eq("is_archived", false),
        user?.id
          ? supabase.from("profiles").select("*").eq("id", user.id).single()
          : Promise.resolve({ data: null }),
      ]);
      setTasks((tasksData ?? []) as Task[]);
      setProfile((profileData as User) ?? null);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pathname === "/home") return <HomeSidebarPanel profile={profile} />;
  if (pathname === "/task" || (pathname.startsWith("/task/") && !pathname.startsWith("/task/list"))) return <TaskBoardSidebarPanel tasks={tasks} />;
  if (pathname.startsWith("/task/list")) return <TaskListSidebarPanel tasks={tasks} currentUserId={currentUserId} />;
  if (pathname.startsWith("/profile")) return <ProfileSidebarPanel profile={profile} />;
  return null;
}
