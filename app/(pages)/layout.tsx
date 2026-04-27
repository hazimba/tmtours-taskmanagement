import LeftNavigation from "@/components/left-navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";
import BottomNav from "./bottom-nav";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { CompanySelector } from "@/components/company-selector";
import { CompanyStoreInitializer } from "@/components/company-store-initializer";
import { getActiveCompanyId } from "@/lib/get-active-company";

const PageLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = user?.user_metadata as Record<string, string> | undefined;
  const isSuperAdmin = meta?.role === "SUPERADMIN";

  const activeCompanyId = await getActiveCompanyId(meta);

  // SUPERADMIN: fetch all companies for the selector
  // Others: fetch just their own company for the name display
  const { data: companies } = isSuperAdmin
    ? await supabase.from("companies").select("id, name").order("name")
    : activeCompanyId
    ? await supabase
        .from("companies")
        .select("id, name")
        .eq("id", activeCompanyId)
    : { data: [] };

  const displayCompany = isSuperAdmin
    ? (companies ?? []).find((c) => c.id === activeCompanyId) ?? null
    : (companies ?? [])[0] ?? null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <CompanyStoreInitializer activeCompanyId={activeCompanyId} />
      <header className="h-12 flex-shrink-0 bg-card/95 backdrop-blur z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="flex items-center gap-6 font-bold text-xl tracking-[5px] select-none">
              <Image
                src="/image.png"
                alt="Logo"
                width={24}
                height={24}
                className="rounded-lg"
              />

              <div>HYNOJURA</div>

              <span className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse" />

              <div className="hidden md:block">
                {isSuperAdmin ? (
                  <CompanySelector
                    companies={companies ?? []}
                    selectedCompanyId={activeCompanyId}
                  />
                ) : (
                  <div className="text-lg font-normal tracking-[8px] text-muted-foreground">
                    {displayCompany?.name ?? "No Company"}
                  </div>
                )}
              </div>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ModeToggle />

            <div className="h-6 w-[1px] bg-border mx-1" />

            <form action="/auth/signout" method="post">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <LeftNavigation
        isSuperAdmin={isSuperAdmin}
        companies={companies ?? []}
        activeCompanyId={activeCompanyId}
        displayCompanyName={displayCompany?.name ?? null}
      >
        {children}
      </LeftNavigation>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t pb-safe">
          <nav className="container max-w-6xl mx-auto flex justify-center py-2 px-4">
            <BottomNav />
          </nav>
          <div className="h-[env(safe-area-inset-bottom)] bg-transparent" />
        </div>
      </footer>
    </div>
  );
};

export default PageLayout;
