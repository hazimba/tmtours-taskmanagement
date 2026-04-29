"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentTasksList } from "@/components/home-charts";
import { Task, Profile } from "@/app/types";

type RecentTasksFilterCardProps = {
  tasks: Task[];
  users: Pick<Profile, "id" | "full_name" | "avatar_url">[];
};

export type FilterOption = {
  label: string;
  title: string;
  desc: string;
  days: number;
};

const filters: FilterOption[] = [
  {
    label: "1",
    title: "Tasks Created Today",
    desc: "Today",
    days: 1,
  },
  {
    label: "2",
    title: "Tasks Created This Week",
    desc: "This Week",
    days: 7,
  },
  {
    label: "3",
    title: "Tasks Created This Month",
    desc: "This Month",
    days: 30,
  },
];

export function RecentTasksFilterCard({
  tasks,
  users,
}: RecentTasksFilterCardProps) {
  const [selectedDays, setSelectedDays] = useState<FilterOption | null>(
    filters[1]
  );

  const activeFilter = filters.find(
    (filter) => filter.days === selectedDays?.days
  );

  const filteredTasks = useMemo(() => {
    const now = new Date();

    const fromDate = new Date(now);

    if (selectedDays?.days === 1) {
      fromDate.setHours(0, 0, 0, 0);
    }

    if (selectedDays?.days === 7) {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;

      fromDate.setDate(now.getDate() - diff);
      fromDate.setHours(0, 0, 0, 0);
    }

    if (selectedDays?.days === 30) {
      fromDate.setDate(1);
      fromDate.setHours(0, 0, 0, 0);
    }

    return tasks.filter((task) => {
      return new Date(task.created_at) >= fromDate;
    });
  }, [tasks, selectedDays?.days]);

  return (
    <Card className="md:!w-4/10 w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between font-semibold">
          <div>{activeFilter?.title}</div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-foreground">
              {activeFilter?.desc}
            </span>
            {filters.map((filter: FilterOption) => (
              <label
                key={filter.days}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-xs font-medium text-foreground">
                  {filter.label}
                </span>

                <input
                  type="checkbox"
                  checked={selectedDays?.days === filter.days}
                  onChange={() => setSelectedDays(filter)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
              </label>
            ))}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <RecentTasksList
          tasks={filteredTasks}
          users={users}
          selectedDays={selectedDays}
        />
      </CardContent>
    </Card>
  );
}
