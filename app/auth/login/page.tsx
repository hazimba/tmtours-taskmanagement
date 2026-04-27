"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { login } from "./action";
import { redirect as nextRedirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
// import { useUserStore } from "@/stores/UserStore";
import { supabase } from "@/lib/supabaseClient";
// import { redirect } from "next/dist/server/api-utils";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type FormValues = z.infer<typeof formSchema>;

const LoginIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  //   const { setLoggedInUser } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    const res = await login(formData);

    if (res?.success) {
      const { data: userData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("email", data.email)
        .single();

      // First-time login — profile not yet completed
      if (!userData?.full_name) {
        nextRedirect("/auth/signup");
      } else {
        nextRedirect("/home");
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen w-full overflow-hidden px-4">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      <div className="absolute -bottom-8 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>

      <Card className="relative w-full max-w-md shadow-2xl bg-white/80 dark:bg-card backdrop-blur-xl border-white/20 z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            Admin Login
          </CardTitle>
          <CardDescription className="text-base">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col justify-between flex-1"
        >
          <CardContent className="grid gap-6">
            <Field className="space-y-2">
              <FieldLabel className="font-semibold" htmlFor="email">
                Email
              </FieldLabel>
              <Input
                {...register("email")}
                className="bg-white/50 border-slate-200 focus:bg-white transition-all shadow-sm"
                id="email"
                type="email"
                placeholder="name@company.com"
                disabled={isLoading}
              />
              {errors.email && (
                <FieldError className="text-xs">
                  {errors.email.message}
                </FieldError>
              )}
            </Field>

            <Field className="space-y-2 pb-4">
              <FieldLabel className="font-semibold" htmlFor="password">
                Password
              </FieldLabel>
              <Input
                {...register("password")}
                className="bg-white/50 border-slate-200 focus:bg-white transition-all shadow-sm"
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && (
                <FieldError className="text-xs">
                  {errors.password.message}
                </FieldError>
              )}
            </Field>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-4">
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                asChild
                className="flex-1 border-slate-200 hover:bg-slate-50"
              >
                <Link href="/home" prefetch={false}>
                  Home
                </Link>
              </Button>
              <Button
                variant="default"
                type="submit"
                className="flex-1 bg-slate-900 hover:bg-slate-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Sign In
              </Button>
            </div>
            {/* hide sign up link in homepage */}
            {/* <div className="w-full text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign Up
              </Link>
            </div> */}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginIn;
