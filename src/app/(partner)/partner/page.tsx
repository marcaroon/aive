import type { Metadata } from "next";
import { PartnerHome } from "@/components/partner/partner-home";

export const metadata: Metadata = { title: "Home" };

export default function PartnerHomePage() {
  return <PartnerHome />;
}
