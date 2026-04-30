import { createClient } from "@/lib/supabase/server";
import { Cycle } from "@/app/types";
import { notFound } from "next/navigation";
import { CycleForm } from "@/components/cycle-form";

export default async function EditCyclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cycle, error } = await supabase
    .from("cycles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !cycle) return notFound();

  return <CycleForm cycle={cycle as Cycle} />;
}
