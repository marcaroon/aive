import type { Metadata } from "next";
import { NotesScreen } from "@/components/partner/notes-screen";

export const metadata: Metadata = { title: "Notes" };

export default function PartnerNotesPage() {
  return <NotesScreen backHref="/partner" />;
}
