"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, Home, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import BottomNav from "./bottom-nav";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/task", label: "Tasks", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-[#020817]">
      {/* Desktop Sidebar - fixed, non-scrollable */}
      <aside className="hidden md:flex md:flex-col md:w-[180px] md:bg-white dark:md:bg-gray-900 md:fixed md:inset-y-0 md:left-0 md:z-40">
        {/* Logo */}
        <div className="h-16 px-4 flex items-center border-b">
          <Link
            href="/home"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-bold text-lg tracking-tight">YourApp</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto md:border-r">
          {sidebarItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content area - with top bar */}
      <div className="flex-1 flex flex-col md:ml-[180px]">
        {/* Top Bar - fixed, non-scrollable */}
        <header className="h-16 flex-shrink-0 sticky top-0 z-30 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80">
          <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
            {/* Mobile logo */}
            <Link
              href="/home"
              className="md:hidden flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="font-bold text-lg tracking-tight">YourApp</span>
            </Link>

            {/* Desktop: Empty left side or breadcrumb can go here */}
            <div className="hidden md:block" />

            {/* Right side actions */}
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

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
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
