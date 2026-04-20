import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  Shield,
  CircleCheck,
  Pencil,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User } from "@/types";

const getInitials = (name: string | null | undefined) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) => (
  <div className="flex items-start gap-3 py-3">
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <Icon className="size-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-foreground">
        {value && value.length > 0 ? value : "—"}
      </p>
    </div>
  </div>
);

const ProfilePage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not signed in</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please sign in to view your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<User>();

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error loading profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error?.message ?? "Profile not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = data.status?.toUpperCase() === "ACTIVE";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-28">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-foreground/10">
        <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 sm:h-40" />

        <div className="bg-card px-5 pb-6 sm:px-8">
          <div className="flex flex-col items-center -mt-14 text-center sm:-mt-16 sm:flex-row sm:items-end sm:text-left">
            <div className="relative">
              <div className="size-28 overflow-hidden rounded-full bg-muted ring-4 ring-card sm:size-32">
                {data.avatar_url ? (
                  <Image
                    src={data.avatar_url}
                    alt={data.full_name ?? "Avatar"}
                    width={128}
                    height={128}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-semibold text-white">
                    {getInitials(data.full_name)}
                  </div>
                )}
              </div>
              {isActive && (
                <span className="absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card">
                  <CircleCheck className="size-3.5 text-white" />
                </span>
              )}
            </div>

            <div className="mt-4 flex-1 sm:mt-0 sm:ml-5 sm:pb-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {data.full_name ?? "Unnamed user"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.position ?? "—"}
                {data.department ? ` · ${data.department}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {data.role && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Shield className="size-3" />
                    {data.role}
                  </span>
                )}
                {data.status && (
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium " +
                      (isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    <span
                      className={
                        "size-1.5 rounded-full " +
                        (isActive ? "bg-emerald-500" : "bg-muted-foreground")
                      }
                    />
                    {data.status}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-0 sm:pb-2">
              <Button variant="outline" size="sm">
                <Pencil className="size-3.5" />
                Edit profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            <InfoRow icon={Mail} label="Email" value={data.email} />
            <InfoRow icon={Phone} label="Phone" value={data.phone} />
            <InfoRow icon={MapPin} label="Location" value={data.location} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            <InfoRow icon={Briefcase} label="Position" value={data.position} />
            <InfoRow
              icon={Building2}
              label="Department"
              value={data.department}
            />
            <InfoRow icon={Shield} label="Role" value={data.role} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Calendar className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Member since
                </p>
                <p className="text-sm font-medium">
                  {formatDate(data.created_at)}
                </p>
              </div>
            </div>
            <Separator className="sm:hidden" />
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Calendar className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Last updated
                </p>
                <p className="text-sm font-medium">
                  {formatDate(data.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
