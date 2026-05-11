"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Task, Profile } from "@/app/types";
import { HomePanel } from "./home-panel";
import { ListPanel } from "./list-panel";
import { BoardPanel } from "./board-panel";
import { ProfilePanel } from "./profile-panel";
import { useCompanyStore } from "@/lib/stores/company-store";

export function SidebarPanel() {
  const pathname = usePathname();
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const activeCompanyId = useCompanyStore((s) => s.activeCompanyId);
  const taskRefreshTrigger = useCompanyStore((s) => s.taskRefreshTrigger);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const tasksQuery = supabase
        .from("tasks")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      // Filter by selected company if set
      if (activeCompanyId) {
        tasksQuery.eq("company_id", activeCompanyId);
      }

      const [{ data: tasksData }, { data: profileData }] = await Promise.all([
        tasksQuery,
        user?.id
          ? supabase.from("profiles").select("*").eq("id", user.id).single()
          : Promise.resolve({ data: null }),
      ]);

      setTasks((tasksData ?? []) as Task[]);
      setProfile((profileData as Profile) ?? null);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompanyId, taskRefreshTrigger]); // re-fetch whenever company changes or a task is created/edited

  if (pathname === "/home") return <HomePanel profile={profile} />;
  if (pathname.startsWith("/task/list"))
    return (
      <ListPanel
        tasks={tasks}
        currentUserId={currentUserId}
        companyId={activeCompanyId}
      />
    );
  if (
    pathname === "/task" ||
    (pathname.startsWith("/task/") && !pathname.startsWith("/task/list"))
  )
    return <BoardPanel tasks={tasks} />;
  if (pathname.startsWith("/profile"))
    return <ProfilePanel profile={profile} />;
  return null;
}
