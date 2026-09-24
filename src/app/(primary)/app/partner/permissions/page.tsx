import type { Metadata } from "next";
import { PermissionDetailScreen } from "@/components/partner/permission-detail-screen";

export const metadata: Metadata = { title: "Sharing details" };

export default function PermissionsPage() {
  return <PermissionDetailScreen />;
}
