"use client"; // Ensure this is at the top of your file

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Icons for the toggle
import { cn } from "@/lib/utils"; // Assuming you use shadcn/ui utility
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Home, Bell, User, List } from "lucide-react";
import { Card } from "./ui/card";

interface LeftNavigationProps {
  children: React.ReactNode;
}

const LeftNavigation = ({ children }: LeftNavigationProps) => {
  const sidebarItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/task", label: "Board", icon: Bell },
    { href: "/task/list", label: "List", icon: List },
    { href: "/profile", label: "Profile", icon: User },
  ];
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="flex flex-1 overflow-hidden pb-20 md:pb-0">
        {/* Dynamic Sidebar */}
        <aside
          className={`relative flex flex-col bg-white dark:bg-card transition-all duration-300 md:block hidden ${
            isCollapsed ? "w-[55px]" : "w-[200px]"
          }`}
        >
          {/* Toggle Button - Positioned at the top right of the sidebar */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute -right-5.5 top-4 z-50 bg-background rounded-full border px-2 py-2 hover:bg-muted transition-all ${
              isCollapsed
                ? "bg-white dark:bg-card border-l-0 border-t-0 border-b-0"
                : "border-r-0 border-t-0 border-b-0"
            }`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
          </button>

          <nav className="flex-1 p-3 space-y-2 overflow-y-auto pt-6">
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
                    // Adjust padding and alignment based on state
                    isCollapsed
                      ? "justify-start px-3 py-2.5 transition-all duration-300"
                      : "gap-3 px-3 py-2.5"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", isCollapsed && "h-5 w-5")}
                  />

                  {/* Hide text when collapsed */}
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
        <main className="flex w-full p-4 md:p-6 gap-4">
          <div className="md:w-8/10 w-full md:px-1 scrollbar-hide overflow-y-auto">
            {children}
          </div>
          <div className="w-2/10 hidden lg:block p-1">
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-semibold">Extra Info</h2>
                <p className="text-sm text-muted-foreground">
                  Something to put here
                </p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};
export default LeftNavigation;
