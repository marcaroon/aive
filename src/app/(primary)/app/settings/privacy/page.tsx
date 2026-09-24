import type { Metadata } from "next";
import { PrivacySettingsScreen } from "@/components/settings/privacy-settings-screen";

export const metadata: Metadata = { title: "Privacy settings" };

export default function PrivacySettingsPage() {
  return <PrivacySettingsScreen />;
}
