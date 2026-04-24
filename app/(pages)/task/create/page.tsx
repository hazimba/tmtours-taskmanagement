import { Suspense } from "react";
import { TaskForm } from "@/components/task-form";

export default function CreateTaskPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskForm />
    </Suspense>
  );
}
