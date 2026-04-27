"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setSelectedCompany } from "@/app/actions/company";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useCompanyStore } from "@/lib/stores/company-store";

interface Company {
  id: string;
  name: string;
}

interface CompanySelectorProps {
  companies: Company[];
  selectedCompanyId: string | null;
}

export function CompanySelector({
  companies,
  selectedCompanyId,
}: CompanySelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const setActiveCompanyId = useCompanyStore((s) => s.setActiveCompanyId);

  function handleChange(value: string) {
    const newId = value === "all" ? null : value;
    setActiveCompanyId(newId); // update Zustand immediately
    startTransition(async () => {
      await setSelectedCompany(newId); // persist to cookie for server components
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Select
        value={selectedCompanyId ?? "all"}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="h-7 text-xs border-none bg-muted/50 hover:bg-muted focus:ring-0 w-[160px] gap-1">
          <SelectValue placeholder="All companies" />
        </SelectTrigger>
        <SelectContent className="z-[10000]">
          <SelectItem value="all" className="text-xs">
            All companies
          </SelectItem>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id} className="text-xs">
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
