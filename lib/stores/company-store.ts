import { create } from "zustand";

interface CompanyStore {
  activeCompanyId: string | null; // null = all companies (SUPERADMIN only)
  setActiveCompanyId: (id: string | null) => void;
  taskRefreshTrigger: number;
  triggerTaskRefresh: () => void;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  activeCompanyId: null,
  setActiveCompanyId: (id) => set({ activeCompanyId: id }),
  taskRefreshTrigger: 0,
  triggerTaskRefresh: () =>
    set((state) => ({ taskRefreshTrigger: state.taskRefreshTrigger + 1 })),
}));
