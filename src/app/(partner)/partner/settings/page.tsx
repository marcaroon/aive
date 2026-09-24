import type { Metadata } from "next";
import { PartnerSettingsScreen } from "@/components/settings/partner-settings-screen";

export const metadata: Metadata = { title: "Settings" };

export default function PartnerSettingsPage() {
  return <PartnerSettingsScreen />;
}
