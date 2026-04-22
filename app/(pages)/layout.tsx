"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import BottomNav from "./bottom-nav";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#020817]">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
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
            <span className="font-bold text-xl tracking-tight hidden sm:block">
              YourApp
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ModeToggle />
            <div className="h-6 w-[1px] bg-border mx-1" />{" "}
            <form action="/auth/signout" method="post">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </section>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t md:border-none md:bg-transparent pb-safe">
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
