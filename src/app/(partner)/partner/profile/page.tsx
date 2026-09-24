import type { Metadata } from "next";
import { PartnerSettingsScreen } from "@/components/settings/partner-settings-screen";

export const metadata: Metadata = { title: "Profile" };

export default function PartnerProfilePage() {
  return <PartnerSettingsScreen />;
}
