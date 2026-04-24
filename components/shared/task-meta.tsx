// Shared task metadata constants and helpers used across components.
import React from "react";
import { TaskStatus, TaskPriority } from "@/types";
import {
  CircleDashed,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  TrendingUp,
  Minus,
  ArrowDown,
} from "lucide-react";

// ─── Status ───────────────────────────────────────────────────────────────────

export const STATUS_META: Record<
  TaskStatus,
  {
    label: string;
    icon: React.ReactNode;
    /** foreground colour class */
    color: string;
    /** badge background class (for sidebar / list) */
    bg: string;
    /** column drop-zone background class (for board) */
    dropBg: string;
  }
> = {
  [TaskStatus.TODO]: {
    label: "To Do",
    icon: <CircleDashed className="h-3.5 w-3.5" />,
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800",
    dropBg: "bg-slate-50 dark:bg-slate-900/30",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: <CircleDot className="h-3.5 w-3.5" />,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    dropBg: "bg-blue-50 dark:bg-blue-900/20",
  },
  [TaskStatus.REVIEW]: {
    label: "Review",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    dropBg: "bg-amber-50 dark:bg-amber-900/20",
  },
  [TaskStatus.COMPLETED]: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    dropBg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  [TaskStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    dropBg: "bg-red-50 dark:bg-red-900/20",
  },
};

// ─── Priority ─────────────────────────────────────────────────────────────────

export const PRIORITY_META: Record<
  TaskPriority,
  {
    label: string;
    icon: React.ReactNode;
    /** foreground colour class */
    color: string;
    /** badge className (background + foreground) for list view */
    className: string;
  }
> = {
  [TaskPriority.URGENT]: {
    label: "Urgent",
    icon: <Flame className="h-3.5 w-3.5" />,
    color: "text-red-500",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  [TaskPriority.HIGH]: {
    label: "High",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    color: "text-orange-500",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  [TaskPriority.MEDIUM]: {
    label: "Medium",
    icon: <Minus className="h-3.5 w-3.5" />,
    color: "text-blue-500",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  [TaskPriority.LOW]: {
    label: "Low",
    icon: <ArrowDown className="h-3.5 w-3.5" />,
    color: "text-slate-400",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
};

/** Numeric weight for sorting priorities (higher = more urgent). */
export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  [TaskPriority.URGENT]: 4,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.LOW]: 1,
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns true if the date is in the past (overdue). */
export function isOverdue(d?: string | null): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

/**
 * Returns true if the date is within the next 7 days (and not already past).
 * Alias: isDueSoonWithinWeek
 */
export function isDueSoon(d?: string | null): boolean {
  if (!d) return false;
  const diff = (new Date(d).getTime() - Date.now()) / 86_400_000;
  return diff >= 0 && diff <= 7;
}

/** Alias kept for backward-compatibility with task-list-view. */
export const isDueSoonWithinWeek = isDueSoon;

/** Format a date string as "1 Jan 2025" (en-MY locale). */
export function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Get up-to-two-letter initials from a display name. */
export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
