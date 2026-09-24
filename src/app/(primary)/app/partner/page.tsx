import type { Metadata } from "next";
import { AUTH_ENABLED } from "@/lib/config";
import { NotesScreen } from "@/components/partner/notes-screen";
import { PartnerSharingScreen } from "@/components/partner/partner-sharing-screen";

export const metadata: Metadata = { title: "Partner" };

export default function PartnerSharingPage() {
  return AUTH_ENABLED ? <PartnerSharingScreen /> : <NotesScreen backHref="/app" showSupport />;
}
