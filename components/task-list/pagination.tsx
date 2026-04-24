"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (p: number) => void;
}

export function Pagination({ page, totalPages, totalCount, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between px-1 pt-1">
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages} &middot; {totalCount} tasks
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="sm" className="h-7 w-7 p-0"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-1">…</span>
          ) : (
            <Button
              key={p}
              variant={page === p ? "default" : "outline"}
              size="sm"
              className="h-7 w-7 p-0 text-xs"
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline" size="sm" className="h-7 w-7 p-0"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
