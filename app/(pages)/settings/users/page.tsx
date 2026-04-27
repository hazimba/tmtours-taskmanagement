"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile } from "@/app/types";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  company_code: z.string().min(3, "Company code is required"),
  role: z.enum(["USER", "ADMIN", "SUPERADMIN"]),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  USER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE: "bg-gray-100 text-gray-500",
};

const UsersPage = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loggedIn, setLoggedIn] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyChecking, setCompanyChecking] = useState(false);
  const [companyFound, setCompanyFound] = useState<boolean | null>(null);

  console.log("users", users);

  useEffect(() => {
    const fetchLoggedInUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLoggedIn(user?.user_metadata as Profile | null);
    };

    fetchLoggedInUser();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", password: "", company_code: "", role: "USER" },
  });

  const companyCode = useWatch({ control, name: "company_code" });

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`*, company:companies (id, name)`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((data as Profile[]) ?? []);
  };

  const verifyCompanyCode = async (code: string) => {
    if (!code || code.length < 3) {
      setCompanyName("");
      setCompanyFound(null);
      return;
    }
    setCompanyChecking(true);
    const { data, error } = await supabase
      .from("companies")
      .select("name")
      .eq("code", code)
      .maybeSingle();
    setCompanyChecking(false);
    if (error || !data) {
      setCompanyName("");
      setCompanyFound(false);
      return;
    }
    setCompanyName(data.name);
    setCompanyFound(true);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`*, company:companies (id, name)`)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
        return;
      }
      setUsers((data as Profile[]) ?? []);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => verifyCompanyCode(companyCode), 500);
    return () => clearTimeout(timer);
  }, [companyCode]);

  const onSubmit = async (values: CreateUserValues) => {
    try {
      setLoading(true);

      // Re-verify company to get company_id
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("code", values.company_code)
        .maybeSingle();

      if (companyError || !company) {
        toast.error("Company not found. Please verify the company code.");
        return;
      }

      // Create auth user + profile stub via admin API route
      const res = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          company_id: company.id,
          role: values.role,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create user");

      toast.success(`User ${values.email} created. They can now log in.`);
      reset();
      setCompanyName("");
      setCompanyFound(null);
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const usersByCompany = users.reduce<Record<string, Profile[]>>(
    (acc, user) => {
      const companyName = user.company?.name ?? "No Company";

      if (!acc[companyName]) {
        acc[companyName] = [];
      }

      acc[companyName].push(user);

      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Create user accounts. On first login they will be prompted to complete
          their profile.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue="create-user"
        className="bg-card rounded-xl w-full"
      >
        <AccordionItem value="create-user" className="rounded-xl border px-4">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create User
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid gap-4 pt-4 md:grid-cols-2"
            >
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Enter user's email address"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Password</label>
                <div className="relative">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Company Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Code</label>
                <Input
                  {...register("company_code")}
                  placeholder="e.g. CODE-123 (ask your superadmin)"
                />
                {errors.company_code && (
                  <p className="text-xs text-destructive">
                    {errors.company_code.message}
                  </p>
                )}
              </div>

              {/* Verified Company */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Verified Company</label>
                <div className="relative">
                  <Input
                    value={
                      companyChecking
                        ? "Checking..."
                        : companyName ||
                          (companyFound === false ? "No company matched" : "")
                    }
                    readOnly
                    placeholder="Auto-fills after code verification"
                    className="bg-muted pr-8"
                  />
                  {!companyChecking && companyFound === true && (
                    <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-green-500" />
                  )}
                  {!companyChecking && companyFound === false && (
                    <XCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  defaultValue="USER"
                  onValueChange={(v) =>
                    setValue("role", v as CreateUserValues["role"])
                  }
                >
                  <SelectTrigger className="md:w-1/2">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    {loggedIn?.role === "SUPERADMIN" && (
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    )}
                    {loggedIn?.role === "ADMIN" && (
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    )}
                    {loggedIn?.role === "SUPERADMIN" && (
                      <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Info banner */}
              <div className="md:col-span-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                <strong>Note:</strong> The user will be created immediately and
                can log in with these credentials. On their first login they
                will be redirected to complete their profile (name, photo,
                department, etc.).
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={loading || !companyFound}
                  className="gap-2"
                >
                  {loading ? (
                    "Creating user…"
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* User List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          User List{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({users.length})
          </span>
        </h2>

        {users.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No users found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(usersByCompany).map(
              ([companyName, companyUsers]) => (
                <div key={companyName} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">{companyName}</h3>

                    <span className="text-xs text-muted-foreground">
                      {companyUsers.length} user
                      {companyUsers.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {companyUsers.map((user) => (
                      <Card key={user.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {user.full_name || (
                              <span className="text-muted-foreground italic font-normal">
                                Pending setup
                              </span>
                            )}
                          </CardTitle>

                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </CardHeader>

                        <CardContent className="space-y-2 text-sm">
                          <div className="flex gap-2 flex-wrap">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                ROLE_COLORS[user.role] ?? ROLE_COLORS["USER"]
                              }`}
                            >
                              {user.role}
                            </span>

                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                STATUS_COLORS[user.status] ??
                                STATUS_COLORS["ACTIVE"]
                              }`}
                            >
                              {user.status}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Joined:{" "}
                            {new Date(user.created_at).toLocaleDateString(
                              "en-MY",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
