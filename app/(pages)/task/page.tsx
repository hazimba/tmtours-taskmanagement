import Link from "next/link";
import { Button } from "@/components/ui/button";

const TaskPage = () => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Task Management</h1>
          <p className="text-muted-foreground">
            Welcome to the Task Management page. Here you can view and manage
            your tasks.
          </p>
        </div>
        <Link href="/task/create">
          <Button>+ Add New Task</Button>
        </Link>
      </div>

      {/* Task list will go here */}
      <div className="mt-6">
        <p className="text-muted-foreground">
          No tasks yet. Create your first task!
        </p>
      </div>
    </div>
  );
};
export default TaskPage;
