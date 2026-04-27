"use client";

import { useEffect } from "react";
import { useCompanyStore } from "@/lib/stores/company-store";

/**
 * Seeds the Zustand store with the active company from the server (cookie).
 * Rendered once in the layout — keeps client store in sync on hard nav / refresh.
 */
export function CompanyStoreInitializer({
  activeCompanyId,
}: {
  activeCompanyId: string | null;
}) {
  const setActiveCompanyId = useCompanyStore((s) => s.setActiveCompanyId);

  useEffect(() => {
    setActiveCompanyId(activeCompanyId);
  }, [activeCompanyId, setActiveCompanyId]);

  return null;
}
