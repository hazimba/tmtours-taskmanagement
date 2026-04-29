"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TaskModalItem = {
  id: string;
  title: string;
  due_date?: string;
  assigned_to?: {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
  };
};

type TaskModalGroup = {
  label: string;
  items: TaskModalItem[];
};

const StatCardStatModal = ({
  label,
  value,
  color,
  icon,
  data = [],
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
  data?: TaskModalGroup[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <Card className="hover:bg-primary hover:!text-white group-hover:bg-white rounded-lg transition-colors group">
      <CardContent
        className="p-4 flex items-center gap-4 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div
          className={`flex size-10 shrink-0 items-center group-hover:text-white justify-center group-hover:bg-black/20 rounded-xl ${color}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="min-w-4xl">
          <DialogTitle>{label}</DialogTitle>

          <DialogDescription>
            <span className="text-sm text-muted-foreground">
              Total: {value}
            </span>
          </DialogDescription>

          <div className="space-y-5 max-h-[60vh] overflow-y-auto">
            {data.map((group) => (
              <div key={group.label} className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {group.label} ({group.items.length})
                </h3>

                {group.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks found.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                    {group.items.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => router.push(`/task/${task.id}`)}
                        className="rounded-md border p-3 text-sm hover:bg-muted cursor-pointer"
                      >
                        <p className="font-medium truncate">{task.title}</p>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {task.due_date && (
                            <p>
                              Due:{" "}
                              {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogClose asChild>
            <div className="flex justify-end w-full">
              <Button variant="outline" className="">
                Close
              </Button>
            </div>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StatCardStatModal;
