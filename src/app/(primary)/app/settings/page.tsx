import type { Metadata } from "next";
import { PrimarySettingsScreen } from "@/components/settings/primary-settings-screen";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <PrimarySettingsScreen />;
}
