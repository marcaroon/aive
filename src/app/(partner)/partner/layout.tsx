import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/layout/route-guard";
import { RelationshipProvider } from "@/contexts/relationship-context";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard role="partner">
      <RelationshipProvider>
        <AppShell role="partner">{children}</AppShell>
      </RelationshipProvider>
    </RouteGuard>
  );
}
