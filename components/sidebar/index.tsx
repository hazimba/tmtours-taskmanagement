"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Task, User } from "@/types";
import { HomePanel } from "./home-panel";
import { ListPanel } from "./list-panel";
import { BoardPanel } from "./board-panel";
import { ProfilePanel } from "./profile-panel";

export function SidebarPanel() {
  const pathname = usePathname();
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  if (pathname === "/home") return <HomePanel profile={profile} />;
  if (pathname.startsWith("/task/list"))
    return <ListPanel tasks={tasks} currentUserId={currentUserId} />;
  if (
    pathname === "/task" ||
    (pathname.startsWith("/task/") && !pathname.startsWith("/task/list"))
  )
    return <BoardPanel tasks={tasks} />;
  if (pathname.startsWith("/profile"))
    return <ProfilePanel profile={profile} />;
  return null;
}
