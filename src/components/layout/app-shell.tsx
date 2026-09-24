"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  HeartHandshake,
  Home,
  LineChart,
  Mail,
  NotebookPen,
  User,
} from "lucide-react";
import { DesktopSidebar, MobileBottomNavigation, type NavItem } from "./bottom-navigation";
import type { UserRole } from "@/types/user";

/**
 * The nav lists live inside the client boundary on purpose: icon components
 * cannot be handed from a Server Component to a Client Component.
 */
const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  primary: [
    { href: "/app", label: "Home", icon: Home },
    { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/app/log", label: "Log", icon: NotebookPen },
    { href: "/app/insights", label: "Insights", icon: LineChart },
    { href: "/app/profile", label: "Profile", icon: User },
  ],
  partner: [
    { href: "/partner", label: "Home", icon: Home },
    { href: "/partner/care", label: "Care", icon: HeartHandshake },
    { href: "/partner/notes", label: "Notes", icon: Mail },
    { href: "/partner/profile", label: "Profile", icon: User },
  ],
};

export function AppShell({ role, children }: { role: UserRole; children: ReactNode }) {
  const items = NAV_ITEMS[role];

  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar items={items} />
      <div className="min-w-0 flex-1">{children}</div>
      <MobileBottomNavigation items={items} />
    </div>
  );
}
