"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TaskModalItem = {
  id: string;
  title: string;
  due_date?: string;
  assigned_to?: string;
};

type TaskModalGroup = {
  label: string;
  items: TaskModalItem[];
};

const StatCardStatModal = ({
  label,
  value,
  color,
  data = [],
}: {
  label: string;
  value: number;
  color: string;
  data?: TaskModalGroup[];
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="hover:bg-primary hover:text-white rounded-lg transition-colors">
      <CardContent
        className="p-4 flex items-center gap-4 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}
        />

        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="min-w-4xl !w-screen">
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
                  <div className="space-y-2">
                    {group.items.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-md border p-3 text-sm"
                      >
                        <p className="font-medium">{task.title}</p>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {task.due_date && (
                            <p>
                              Due:{" "}
                              {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}

                          {task.assigned_to && (
                            <p>Assigned to: {task.assigned_to}</p>
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
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StatCardStatModal;
