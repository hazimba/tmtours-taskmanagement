"use client";

import { Bell, Home, User, List } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/task/list", label: "List", icon: List },
  { href: "/task", label: "Board", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

const BottomNav = () => {
  const pathname = usePathname();
  const active =
    items.find((item) =>
      item.href === "/task"
        ? pathname === "/task" ||
          (pathname.startsWith("/task/") && !pathname.startsWith("/task/list"))
        : pathname === item.href || pathname.startsWith(item.href + "/")
    )?.href ?? items[0].href;

  return (
    <Tabs
      value={active}
      className="w-full items-center justify-center fixed bottom-6 text-white px-4"
    >
      <TabsList className="grid grid-cols-4 items-center w-full">
        {items.map(({ href, label, icon: Icon }) => (
          <TabsTrigger key={href} value={href} asChild className="text-xs">
            <Link href={href}>
              <Icon className="size-4" />
              <span className="">{label}</span>
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default BottomNav;
