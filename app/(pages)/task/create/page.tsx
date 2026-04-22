"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { taskSchema, type TaskFormData } from "@/lib/validations/task";
import { TaskStatus, TaskPriority, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { SingleDatePicker } from "@/components/single-date-picker";
import { ArrowLeft } from "lucide-react";

export default function CreateTaskPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);

  console.log("Users:", users);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name");
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    setUsers(data);
  };

  useEffect(() => {
    const fetch = async () => {
      await fetchUsers();
    };
    fetch();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigned_to: "",
      tags: [],
      attachments: [],
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    console.log("Form data:", data);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // return;

    if (!user?.id) {
      toast.error("You must be logged in to create a task.");
      router.push("/login");
      return;
    }

    try {
      const insertData = {
        id: uuidv4(),
        created_by: user.id,
        ...data,
      };

      const { error } = await supabase.from("tasks").insert([insertData]);

      if (error) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Task created successfully!");
      reset();
      router.push("/task");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task. Please try again.");
    }
  };

  return (
    <div className="container max-w-2xl">
      <div className="mb-6">
        <Button
          type="button"
          variant="link"
          onClick={() => router.push("/task")}
          className="mb-4 px-0"
        >
          <ArrowLeft /> Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Task</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to create a new task
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter task title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Enter task description"
              rows={4}
              className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.description ? "border-red-500" : ""
              }`}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <SingleDatePicker
                value={
                  watch("start_date")
                    ? new Date(watch("start_date"))
                    : undefined
                }
                onChange={(date) => {
                  setValue("start_date", date?.toISOString() ?? "");
                }}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              {/* <Input id="due_date" type="date" {...register("due_date")} /> */}
              <SingleDatePicker
                value={
                  watch("due_date") ? new Date(watch("due_date")) : undefined
                }
                onChange={(date) => {
                  setValue("due_date", date?.toISOString() ?? "");
                }}
              />
              {errors.due_date && (
                <p className="text-sm text-red-500">
                  {errors.due_date.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                key="priority"
                value={watch("priority")}
                onValueChange={(value) =>
                  setValue("priority", value as TaskPriority)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    defaultValue={TaskPriority.MEDIUM}
                    placeholder="Select priority"
                  />
                </SelectTrigger>
                <SelectContent defaultValue={TaskPriority.MEDIUM}>
                  <SelectGroup>
                    <SelectLabel>Priority Levels</SelectLabel>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                    <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-red-500">
                  {errors.priority.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                key="status"
                value={watch("status")}
                onValueChange={(value) =>
                  setValue("status", value as TaskStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status Levels</SelectLabel>
                    <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>
                      In Progress
                    </SelectItem>
                    <SelectItem value={TaskStatus.REVIEW}>Review</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>
                      Completed
                    </SelectItem>
                    <SelectItem value={TaskStatus.CANCELLED}>
                      Cancelled
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select
                value={watch("assigned_to")}
                onValueChange={(value) => {
                  setValue("assigned_to", value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Users</SelectLabel>

                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.assigned_to && (
                <p className="text-sm text-red-500">
                  {errors.assigned_to.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...register("category")}
              placeholder="Enter category (optional)"
            />
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/task")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
