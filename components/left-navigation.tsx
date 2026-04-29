"use client";

import { cn } from "@/lib/utils";
import {
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  Home,
  List,
  PanelRight,
  User,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SidebarPanel } from "./sidebar-panel";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/app/types";
import { CompanySelector } from "@/components/company-selector";

interface LeftNavigationProps {
  children: React.ReactNode;
  isSuperAdmin: boolean;
  companies: { id: string; name: string }[];
  activeCompanyId: string | null;
  displayCompanyName: string | null;
}

const LeftNavigation = ({
  children,
  isSuperAdmin,
  companies,
  activeCompanyId,
  displayCompanyName,
}: LeftNavigationProps) => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);
  const [loggedIn, setLoggedIn] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLoggedIn(user?.user_metadata as Profile | null);
    }
    load();
  }, []);

  const sidebarItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/task", label: "Board", icon: Bell },
    { href: "/task/list", label: "List", icon: List },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const sidebarSettingItems = [
    {
      href: "/settings/users",
      label: "Users",
      icon: UserCog,
      auth: ["ADMIN", "SUPERADMIN"],
    },
    {
      href: "/settings/companies",
      label: "Companies",
      icon: Building2,
      auth: ["SUPERADMIN"],
    },
  ];

  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mobileSidebarRef.current &&
        !mobileSidebarRef.current.contains(e.target as Node)
      ) {
        setShowMobileSidebar(false);
      }
    }
    if (showMobileSidebar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMobileSidebar]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="flex flex-1 overflow-hidden md:pb-0">
        {/* Desktop Left Sidebar */}
        <aside
          className={`relative flex flex-col bg-white dark:bg-card transition-all duration-300 md:block hidden ${
            isCollapsed ? "w-[52px]" : "w-[200px]"
          }`}
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute -right-5.5 top-4 z-50 bg-background rounded-full border px-2 py-2 hover:bg-muted transition-all ${
              isCollapsed
                ? "bg-white dark:bg-card border-l-0 border-t-0 border-b-0"
                : "border-r-0 border-t-0 border-b-0"
            }`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-6 w-6 cursor-pointer" />
            ) : (
              <ChevronLeft className="h-6 w-6 cursor-pointer" />
            )}
          </button>

          <nav className="flex-1 p-3 space-y-2 overflow-y-auto pt-6 justify-between">
            <div className="px-3 pb-6 pt-2 h-6 flex items-center">
              <span
                className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-all duration-200 ${
                  isCollapsed ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
              >
                Menu
              </span>
            </div>
            {sidebarItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/task"
                  ? pathname === "/task" ||
                    (pathname.startsWith("/task/") &&
                      !pathname.startsWith("/task/list"))
                  : pathname === href || pathname.startsWith(href + "/");

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all duration-300 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed
                      ? "justify-start px-3 py-2.5"
                      : "gap-3 px-3 py-2.5"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", isCollapsed && "h-5 w-5")}
                  />
                  {!isCollapsed && (
                    <span className="truncate opacity-100 transition-opacity duration-300">
                      {label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <nav className="flex-1 p-3 space-y-2 overflow-hidden pt-6">
            <div className="px-3 pb-6 pt-2 h-6 flex items-center">
              <span
                className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-all duration-200 ${
                  loggedIn?.role === "USER" ? "hidden" : ""
                } ${
                  isCollapsed ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
              >
                Settings
              </span>
            </div>
            {sidebarSettingItems.map(({ href, label, icon: Icon, auth }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");

              const hasAuth = loggedIn && auth.includes(loggedIn.role);
              if (!hasAuth) return null;

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all duration-300 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed
                      ? "justify-start px-3 py-2.5"
                      : "gap-3 px-3 py-2.5"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", isCollapsed && "h-5 w-5")}
                  />
                  {!isCollapsed && (
                    <span className="truncate opacity-100 transition-opacity duration-300">
                      {label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex w-full md:ml-4 p-4 md:pb-0 md:p-6 gap-4">
          <div className="md:w-8/10 w-full pb-20 md:px-1 scrollbar-hide overflow-y-auto">
            {children}
          </div>

          {/* Desktop: right sidebar panel */}
          <div className="w-2/10 hidden lg:block p-1 overflow-y-auto scrollbar-hide">
            <SidebarPanel />
          </div>

          {/* Mobile only: floating trigger button (hidden on lg+) */}
          <button
            onClick={() => setShowMobileSidebar((v) => !v)}
            className="lg:hidden fixed top-24 right-4 z-[100] bg-background border border-border rounded-full p-2.5 shadow-md hover:bg-muted transition-all duration-300"
            aria-label="Open sidebar panel"
          >
            <PanelRight className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Mobile only: floating sidebar panel overlay (always mounted for animation) */}
          <>
            {/* Backdrop */}
            <div
              onClick={() => setShowMobileSidebar(false)}
              className={`lg:hidden fixed inset-0 z-[99] bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 ${
                showMobileSidebar
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
            />
            {/* Slide-in panel */}
            <div
              ref={mobileSidebarRef}
              className={`lg:hidden fixed top-0 right-0 z-[9999] h-full w-72 bg-background border-l border-border shadow-xl overflow-y-auto p-4 scrollbar-hide transition-transform duration-300 ease-in-out ${
                showMobileSidebar ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Info Panel
                </span>
              </div>
              <div className="mb-6">
                {isSuperAdmin ? (
                  <CompanySelector
                    companies={companies}
                    selectedCompanyId={activeCompanyId}
                  />
                ) : (
                  <div className="text-sm font-normal tracking-widest text-muted-foreground">
                    {displayCompanyName ?? "No Company"}
                  </div>
                )}
              </div>
              <SidebarPanel />
            </div>
          </>
        </main>
      </div>
    </div>
  );
};

export default LeftNavigation;
