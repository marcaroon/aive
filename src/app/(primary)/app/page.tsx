import type { Metadata } from "next";
import { HomeDashboard } from "@/components/cycle/home-dashboard";

export const metadata: Metadata = { title: "Home" };

export default function PrimaryHomePage() {
  return <HomeDashboard />;
}
