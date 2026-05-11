"use client";

import { Profile } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/components/shared/task-meta";
import { LiveClock } from "./live-clock";
import { useCompanyStore } from "@/lib/stores/company-store";
import { ActivityFeed } from "./activity-feed";

export function HomePanel({ profile }: { profile: Profile | null }) {
  const companyId = useCompanyStore((s) => s.activeCompanyId);
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
          <Avatar className="h-14 w-14 mt-1">
            <AvatarImage src={profile?.avatar_url ?? ""} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-tight">
              {profile?.full_name ?? "—"}
            </p>
            {profile?.position && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {profile.position}
              </p>
            )}
            {profile?.department && (
              <p className="text-[11px] text-muted-foreground">
                {profile.department}
              </p>
            )}
            {profile?.role && (
              <span className="inline-block mt-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {profile.role}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <LiveClock />
        </CardContent>
      </Card>
      <Card className="h-1/3 overflow-y-auto">
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 !h-1/3 overflow-y-auto">
          <ActivityFeed companyId={companyId} />
        </CardContent>
      </Card>
    </div>
  );
}
