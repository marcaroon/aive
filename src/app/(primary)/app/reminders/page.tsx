import type { Metadata } from "next";
import { RemindersScreen } from "@/components/settings/reminders-screen";

export const metadata: Metadata = { title: "Reminders" };

export default function RemindersPage() {
  return <RemindersScreen />;
}
