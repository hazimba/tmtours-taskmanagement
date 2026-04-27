"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Database } from "@/app/types/database";

const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  code: z.string().min(6, "Company code must be at least 6 characters"),
});

type CompanyFormValues = z.infer<typeof companySchema>;

type Company = Database["public"]["Tables"]["companies"]["Row"];

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("id,name,created_at,code,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }

    setCompanies(data ?? []);
  };

  useEffect(() => {
    const loadCompanies = async () => {
      setLoading(true);
      await fetchCompanies();
      setLoading(false);
    };

    loadCompanies();
  }, []);

  const onSubmit = async (values: CompanyFormValues) => {
    try {
      setLoading(true);

      const res = await supabase.from("companies").insert({
        id: uuidv4(),
        name: values.name,
        code: values.code,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (res.error) {
        throw new Error(res.error.message || "Failed to create company");
      }

      toast.success("Company created successfully");
      reset();
      fetchCompanies();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Companies</h1>
        <p className="text-sm text-muted-foreground">
          Manage all companies in your SaaS platform.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue="create"
        className="bg-card w-full rounded-xl"
      >
        <AccordionItem value="create" className="rounded-xl border px-4">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Create Company
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid gap-4 pt-4 md:grid-cols-2"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input placeholder="Company Name..." {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company Code</label>
                <Input placeholder="Company Code..." {...register("code")} />
                {errors.code && (
                  <p className="text-sm text-destructive">
                    {errors.code.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Company List</h2>

        {companies.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No companies found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <Card key={company.id}>
                <CardHeader>
                  <CardTitle className="text-base">{company.name}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>ID: {company.id}</p>
                  <p>Code: {company.code}</p>
                  <p>
                    Created:{" "}
                    {company.created_at
                      ? new Date(company.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;
