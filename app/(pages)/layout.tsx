import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

import BottomNav from "./bottom-nav";
import { ModeToggle } from "@/components/mode-toggle";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className=" py-3 border-b border-gray-700 shrink-0">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">
            TM Task Management
          </h1>
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
      </header>

      <main className="flex-grow overflow-y-auto scrollbar-hide">
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
