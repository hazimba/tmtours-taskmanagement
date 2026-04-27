"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/app/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient();

const profileSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  department: z.string().min(1, "Department is required"),
  position: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const DEPARTMENTS: Database["public"]["Enums"]["user_department"][] = [
  "SALES",
  "ADMIN",
  "DESIGNER",
  "MANAGER",
  "MARKETING",
  "SUPPORT",
  "IT",
  "HR",
  "FINANCE",
  "LEGAL",
  "OPERATIONS",
  "RESEARCH",
  "SALES_SUPPORT",
  "ECOMMERCE",
];

type SessionUser = { id: string; email: string; company_id: string };

export default function SignupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmedFile, setConfirmedFile] = useState<File | null>(null);
  const [confirmedPreview, setConfirmedPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  // Load session — if full_name already set, skip to /home
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (error || !user) {
        toast.error("Session not found. Please log in.");
        router.replace("/auth/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, full_name")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        router.replace("/home");
        return;
      }
      setSessionUser({
        id: user.id,
        email: user.email ?? "",
        company_id: profile?.company_id ?? "",
      });
      setLoadingSession(false);
    });
  }, [router]);

  // ── Image handlers ────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setConfirmedFile(null);
    setConfirmedPreview(null);
  };

  const handleConfirmImage = () => {
    if (!selectedFile || !previewUrl) return;
    setConfirmedFile(selectedFile);
    setConfirmedPreview(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    toast.success("Photo confirmed — will upload on submit.");
  };

  const handleDiscardSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveConfirmed = () => {
    setConfirmedFile(null);
    setConfirmedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Profile photo removed");
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (values: ProfileValues) => {
    if (!sessionUser) return;
    setSubmitting(true);
    try {
      let avatar_url: string | null = null;

      if (confirmedFile && sessionUser.company_id) {
        setUploading(true);
        const ext = confirmedFile.name.split(".").pop();
        const path = `${sessionUser.company_id}/${sessionUser.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-images")
          .upload(path, confirmedFile, { upsert: true });
        if (uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`);
        const { data: urlData } = supabase.storage
          .from("profile-images")
          .getPublicUrl(path);
        avatar_url = urlData.publicUrl;
        setUploading(false);
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: sessionUser.id,
        email: sessionUser.email,
        full_name: values.full_name,
        phone: values.phone ?? null,
        location: values.location,
        department:
          values.department as Database["public"]["Enums"]["user_department"],
        position: values.position ?? null,
        company_id: sessionUser.company_id,
        avatar_url,
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      });
      if (profileError) throw new Error(profileError.message);

      toast.success("Profile complete! Taking you to your dashboard…");
      router.replace("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Complete Your Profile</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Welcome! Fill in your details to get started.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground border rounded-lg px-3 py-2 bg-muted/40">
            Logged in as{" "}
            <span className="font-medium text-foreground">
              {sessionUser?.email}
            </span>
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Photo */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Profile Photo</label>
              <div className="flex items-start gap-4">
                {/* Avatar circle */}
                <div className="relative h-20 w-20 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted shrink-0">
                  {confirmedPreview ?? previewUrl ? (
                    <Image
                      src={(confirmedPreview ?? previewUrl)!}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Camera className="h-7 w-7 text-muted-foreground" />
                  )}
                  {confirmedPreview && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!selectedFile && !confirmedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Photo
                    </Button>
                  )}

                  {selectedFile && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {selectedFile.name} (
                        {(selectedFile.size / 1024).toFixed(0)} KB)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleConfirmImage}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirm
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDiscardSelection}
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  )}

                  {confirmedFile && (
                    <div className="space-y-2">
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Photo confirmed
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Replace
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveConfirmed}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF · Max 5 MB · Click <strong>Confirm</strong>{" "}
                    to lock in your choice.
                  </p>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input {...register("full_name")} placeholder="John Smith" />
                {errors.full_name && (
                  <p className="text-xs text-destructive">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input {...register("phone")} placeholder="+60 12 345 6789" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location *</label>
                <Input
                  {...register("location")}
                  placeholder="Kuala Lumpur, Malaysia"
                />
                {errors.location && (
                  <p className="text-xs text-destructive">
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <Input
                  {...register("position")}
                  placeholder="e.g. Senior Executive"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Department *</label>
                <Select onValueChange={(v) => setValue("department", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department…" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-xs text-destructive">
                    {errors.department.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? "Uploading photo…" : "Saving your profile…"}
                </>
              ) : (
                "Complete Setup & Go to Dashboard"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
