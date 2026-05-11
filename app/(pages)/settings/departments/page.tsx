"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Department } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Plus, Trash2, Building2 } from "lucide-react";

const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(80),
});
type DepartmentFormValues = z.infer<typeof departmentSchema>;

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "" },
  });

  const editForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "" },
  });

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchDepartments = async (cid: string) => {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", cid)
      .order("name", { ascending: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    setDepartments(data ?? []);
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      const cid = profile?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await fetchDepartments(cid);
      setLoading(false);
    }
    init();
  }, []);

  // ── create ────────────────────────────────────────────────────────────────
  const onCreateSubmit = async (values: DepartmentFormValues) => {
    if (!companyId) return;
    setSubmitting(true);
    const { error } = await supabase.from("departments").insert({
      id: uuidv4(),
      name: values.name,
      company_id: companyId,
      created_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Department created");
    createForm.reset();
    setShowCreate(false);
    fetchDepartments(companyId);
  };

  // ── edit ──────────────────────────────────────────────────────────────────
  const openEdit = (dept: Department) => {
    setEditTarget(dept);
    editForm.reset({ name: dept.name });
  };

  const onEditSubmit = async (values: DepartmentFormValues) => {
    if (!editTarget || !companyId) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("departments")
      .update({ name: values.name })
      .eq("id", editTarget.id);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Department updated");
    setEditTarget(null);
    fetchDepartments(companyId);
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget || !companyId) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", deleteTarget.id);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Department deleted");
    setDeleteTarget(null);
    fetchDepartments(companyId);
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Departments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage departments used to categorise tasks across your company.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Department
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No departments yet.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create your first department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 group"
            >
              <div>
                <p className="text-sm font-medium">{dept.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Created{" "}
                  {new Date(dept.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => openEdit(dept)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteTarget(dept)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Department</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="create-name">Department Name</Label>
              <Input
                id="create-name"
                placeholder="e.g. Engineering, Marketing…"
                {...createForm.register("name")}
                className={
                  createForm.formState.errors.name ? "border-destructive" : ""
                }
              />
              {createForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">Department Name</Label>
              <Input
                id="edit-name"
                {...editForm.register("name")}
                className={
                  editForm.formState.errors.name ? "border-destructive" : ""
                }
              />
              {editForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be removed. Tasks
              linked to this department will have their department cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
