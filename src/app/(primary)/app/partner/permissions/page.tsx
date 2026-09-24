import { redirect } from "next/navigation";
import { AUTH_ENABLED } from "@/lib/config";
import type { Metadata } from "next";
import { PermissionDetailScreen } from "@/components/partner/permission-detail-screen";

export const metadata: Metadata = { title: "Sharing details" };

export default function PermissionsPage() {
  if (!AUTH_ENABLED) redirect("/app/partner");
  return <PermissionDetailScreen />;
}
