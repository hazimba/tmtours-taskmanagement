"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, Home, Bell, User, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import BottomNav from "./bottom-nav";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import LeftNavigation from "@/components/left-navigation";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Unified Top Header - One Div for Logo and Actions */}
      <header className="h-12 flex-shrink-0 bg-card/95 backdrop-blur z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Logo Section */}
          <Link
            href="/home"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {/* <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-lg"
            /> */}
            <span className="flex items-center gap-2 font-bold text-xl tracking-widest select-none">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              SYNCTASK
            </span>
          </Link>

          {/* Action Section (Logout/Toggle) */}
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

      {/* Main Layout Body (Sidebar + Content) */}

      {/* Sidebar - Now starts below the header */}
      <LeftNavigation>{children}</LeftNavigation>

      {/* Mobile Bottom Nav */}
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
