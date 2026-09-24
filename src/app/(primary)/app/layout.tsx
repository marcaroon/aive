import type { ReactNode } from "react";
import { AppLock } from "@/components/layout/app-lock";
import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/layout/route-guard";
import { RelationshipProvider } from "@/contexts/relationship-context";

export default function PrimaryLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard role="primary">
      <AppLock>
        <RelationshipProvider>
          <AppShell role="primary">{children}</AppShell>
        </RelationshipProvider>
      </AppLock>
    </RouteGuard>
  );
}
