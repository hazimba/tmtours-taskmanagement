"use client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

import BottomNav from "./bottom-nav";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";
import { redirect } from "next/navigation";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="relative py-3">
        <div className="w-screen flex justify-center">
          <div className="fixed max-w-6xl w-full p-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b shadow-[0_0px_6px_-1px_rgba(0,0,0,0.1)] z-10 top-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="mr-2"
              onClick={() => redirect("/home")}
            />
            <div className="flex items-center space-x-4">
              <ModeToggle />
              <form action="/auth/signout" method="post">
                <Button
                  variant="ghost"
                  size="sm"
                  className="dark:hover:bg-red-900/50 dark:hover:text-red-200 transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto scrollbar-hide py-22">
        <div className="container mx-auto scrollbar-hide">{children}</div>
      </main>

      <footer className="relative">
        <nav className="container mx-auto flex justify-center px-4">
          <BottomNav />
        </nav>
      </footer>
    </div>
  );
};

export default PageLayout;
