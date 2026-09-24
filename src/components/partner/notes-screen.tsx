"use client";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { LoveNoteComposer } from "./love-note-composer";
import { LoveNoteCard } from "./love-note-card";
import { useRelationship } from "@/contexts/relationship-context";
import { useLoveNotes } from "@/hooks/use-partner";
import { PARTNER } from "@/lib/copy";
import { SupportRequestComposer } from "./support-request-composer";
import { SUPPORT } from "@/lib/copy";

export function NotesScreen({
  backHref,
  showSupport = false,
}: {
  backHref?: string;
  showSupport?: boolean;
}) {
  const { relationship, loading } = useRelationship();
  const notes = useLoveNotes(50);

  return (
    <>
      <AppHeader title={showSupport ? "Us" : "Notes"} backHref={backHref} />

      <PageContainer>
        {loading ? <LoadingState lines={3} /> : null}

        {!loading && !relationship ? (
          <EmptyState
            title="Not connected yet."
            description="Your notes will show up here once you're connected."
          />
        ) : null}

        {!loading && relationship ? (
          <div className="space-y-6">
            {showSupport && (
              <section>
                <SectionHeader
                  title={SUPPORT.title}
                  description={SUPPORT.subtitle}
                />
                <SupportRequestComposer />
              </section>
            )}
            <LoveNoteComposer onSent={() => void notes.refresh()} />

            <section>
              <SectionHeader title={PARTNER.notesTitle} />

              {notes.loading ? <LoadingState lines={2} /> : null}

              {!notes.loading && (notes.data?.length ?? 0) === 0 ? (
                <EmptyState
                  title={PARTNER.noNotes}
                  description={PARTNER.noNotesBody}
                />
              ) : null}

              <ul className="space-y-3">
                {notes.data?.map((note) => (
                  <li key={note.id}>
                    <LoveNoteCard
                      note={note}
                      onChanged={() => void notes.refresh()}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}
