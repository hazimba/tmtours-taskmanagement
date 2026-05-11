import { supabase } from "@/lib/supabaseClient";
import { ActivityType, ActivityAction } from "@/app/types";

interface LogActivityParams {
  task_id: string;
  user_id: string;
  company_id: string | null;
  type: ActivityType;
  action: ActivityAction;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export async function logActivity(params: LogActivityParams) {
  const { error } = await supabase.from("task_activities").insert({
    task_id: params.task_id,
    user_id: params.user_id,
    company_id: params.company_id,
    type: params.type,
    action: params.action,
    old_value: params.old_value ?? null,
    new_value: params.new_value ?? null,
    metadata: params.metadata ?? null,
  });
  if (error) {
    console.error("[logActivity] failed:", error.message);
  }
}
