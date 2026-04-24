"use client";

import { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfilePanel({ profile }: { profile: User | null }) {
  if (!profile) return null;

  const fields: { label: string; value: string | null | undefined }[] = [
    { label: "Full name", value: profile.full_name },
    { label: "Email", value: profile.email },
    { label: "Phone", value: profile.phone },
    { label: "Location", value: profile.location },
    { label: "Position", value: profile.position },
    { label: "Department", value: profile.department },
    { label: "Profile photo", value: profile.avatar_url },
  ];

  const missing = fields.filter((f) => !f.value);
  const filled = fields.filter((f) => !!f.value);
  const pct = Math.round((filled.length / fields.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Profile Completeness
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {filled.length}/{fields.length} fields
            </span>
            <span
              className={cn(
                "font-semibold",
                pct === 100 ? "text-emerald-500" : "text-amber-500"
              )}
            >
              {pct}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                pct === 100 ? "bg-emerald-500" : "bg-amber-400"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {missing.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Missing
            </p>
            {missing.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 text-[11px] text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-500 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Profile complete!
          </p>
        )}

        <div className="space-y-1.5 border-t border-border pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Completed
          </p>
          {filled.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-[11px]">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              <span className="text-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
