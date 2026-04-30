"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { cycleSchema, type CycleFormData } from "@/lib/validations/cycle";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SingleDatePicker } from "@/components/single-date-picker";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useWatch } from "react-hook-form";
import { Cycle, CycleStatus } from "@/app/types";

interface CycleFormProps {
  cycle?: Cycle;
}

const STATUS_LABELS: Record<CycleStatus, string> = {
  [CycleStatus.PLANNED]: "Planned",
  [CycleStatus.ACTIVE]: "Active",
  [CycleStatus.COMPLETED]: "Completed",
  [CycleStatus.CANCELLED]: "Cancelled",
  [CycleStatus.ON_HOLD]: "On Hold",
};

export function CycleForm({ cycle }: CycleFormProps) {
  const isEdit = !!cycle;
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CycleFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(cycleSchema) as any,
    defaultValues: isEdit
      ? {
          name: cycle.name,
          description: cycle.description ?? "",
          status: cycle.status,
          start_date: cycle.start_date ?? "",
          end_date: cycle.end_date ?? "",
        }
      : { status: CycleStatus.PLANNED },
  });

  const watchedStatus = useWatch({ control, name: "status" });
  const watchedStartDate = useWatch({ control, name: "start_date" }) ?? "";
  const watchedEndDate = useWatch({ control, name: "end_date" }) ?? "";

  const onSubmit = async (data: CycleFormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      toast.error("You must be logged in.");
      return;
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const companyId = myProfile?.company_id ?? null;

    try {
      if (isEdit) {
        const { error } = await supabase
          .from("cycles")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            description: data.description || null,
          })
          .eq("id", cycle!.id);
        if (error) throw error;
        toast.success("Cycle updated!");
        router.push("/cycle");
      } else {
        const { error } = await supabase.from("cycles").insert([
          {
            id: uuidv4(),
            created_by: user.id,
            company_id: companyId,
            is_archived: false,
            name: data.name,
            description: data.description || null,
            status: data.status,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
          },
        ]);
        if (error) throw error;
        toast.success("Cycle created!");
        router.push("/cycle");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${isEdit ? "update" : "create"} cycle.`);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Button
          type="button"
          variant="link"
          className="mb-3 !px-0 cursor-pointer !no-underline"
          onClick={() => router.push("/cycle")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Cycles
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Cycle" : "Create New Cycle"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit
            ? "Update the cycle details below"
            : "Set up a new sprint or work cycle"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card className="px-5 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Basic Info
          </p>
          <div className="space-y-2">
            <Label htmlFor="name">
              Cycle Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. Sprint 1, Q2 Cycle..."
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="What is this cycle about?"
              rows={3}
            />
          </div>
        </Card>

        {/* Status & Dates */}
        <Card className="px-5 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status & Timeline
          </p>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={watchedStatus}
              onValueChange={(v) => setValue("status", v as CycleStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CycleStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <SingleDatePicker
                value={
                  watchedStartDate ? new Date(watchedStartDate) : undefined
                }
                onChange={(date) =>
                  setValue("start_date", date?.toISOString() ?? "")
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <SingleDatePicker
                value={watchedEndDate ? new Date(watchedEndDate) : undefined}
                onChange={(date) =>
                  setValue("end_date", date?.toISOString() ?? "")
                }
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pb-10">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
              ? "Save Changes"
              : "Create Cycle"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => router.push("/cycle")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
