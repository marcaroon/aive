import type { Metadata } from "next";
import { PartnerSharingScreen } from "@/components/partner/partner-sharing-screen";

export const metadata: Metadata = { title: "Partner" };

export default function PartnerSharingPage() {
  return <PartnerSharingScreen />;
}
