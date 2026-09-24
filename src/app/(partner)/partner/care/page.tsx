import type { Metadata } from "next";
import { CareScreen } from "@/components/partner/care-screen";

export const metadata: Metadata = { title: "Care" };

export default function CarePage() {
  return <CareScreen />;
}
