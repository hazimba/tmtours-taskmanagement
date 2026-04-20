"use client";

import { Bell, Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/task", label: "Task", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  // { href: "/settings", label: "Settings", icon: Settings },
];

const BottomNav = () => {
  const pathname = usePathname();
  const active =
    items.find((item) => pathname.startsWith(item.href))?.href ?? items[0].href;

  return (
    <Tabs
      value={active}
      className="w-full items-center fixed bottom-5 text-white border-none bg-transparent"
    >
      <TabsList className="">
        {items.map(({ href, label, icon: Icon }) => (
          <TabsTrigger key={href} value={href} asChild className="px-3 text-xs">
            <Link href={href}>
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default BottomNav;
