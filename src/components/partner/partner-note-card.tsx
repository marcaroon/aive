"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Mail } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { useLatestLoveNote } from "@/hooks/use-partner";
import { markNoteRead } from "@/services/love-note-service";

/** The most recent note from the partner, shown on Aivel's home screen. */
export function PartnerNoteCard() {
  const { user } = useAuthContext();
  const { relationship } = useRelationship();
  const { latest, loading } = useLatestLoveNote();

  useEffect(() => {
    if (!relationship || !latest || latest.readAt) return;
    if (latest.authorId === user?.uid) return;
    void markNoteRead(relationship.id, latest.id);
  }, [relationship, latest, user]);

  if (!relationship || loading || !latest) return null;

  return (
    <Link
      href="/app/partner"
      className="card block p-5 transition-colors hover:bg-[var(--color-cream)]"
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        <Mail className="h-3.5 w-3.5" aria-hidden />
        A note for you
      </div>
      <p className="mt-2 text-[15px] leading-relaxed">
        {latest.emoji ? <span className="mr-1.5">{latest.emoji}</span> : null}
        {latest.message}
      </p>
    </Link>
  );
}
