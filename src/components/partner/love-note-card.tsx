"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { enUS as enLocale } from "date-fns/locale";
import { EyeOff } from "lucide-react";
import { PARTNER } from "@/lib/copy";
import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { hideNoteForUser, NOTE_REACTIONS, reactToNote } from "@/services/love-note-service";
import type { LoveNote } from "@/types/relationship";
import { cn } from "@/lib/utils/cn";

export function LoveNoteCard({
  note,
  onChanged,
}: {
  note: LoveNote;
  onChanged: () => void;
}) {
  const { user } = useAuthContext();
  const { relationship } = useRelationship();
  const [busy, setBusy] = useState(false);

  const mine = note.authorId === user?.uid;

  const react = async (reaction: string) => {
    if (!relationship || busy) return;
    setBusy(true);
    try {
      await reactToNote(relationship.id, note.id, note.reaction === reaction ? "" : reaction);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const hide = async () => {
    if (!relationship || !user || busy) return;
    setBusy(true);
    try {
      await hideNoteForUser(relationship.id, note.id, user.uid);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={cn(
        "card p-4",
        mine ? "bg-[var(--color-cream)]" : "bg-[var(--color-surface)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {mine ? PARTNER.wroteByYou : PARTNER.wroteForYou}
        </span>
        {note.createdAt ? (
          <span className="text-xs text-[var(--color-muted)]">
            {formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true, locale: enLocale })}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-[15px] leading-relaxed">
        {note.emoji ? <span className="mr-1.5">{note.emoji}</span> : null}
        {note.message}
      </p>

      <div className="mt-3 flex items-center gap-1">
        {!mine
          ? NOTE_REACTIONS.map((reaction) => (
              <button
                key={reaction}
                type="button"
                aria-label={`React with ${reaction}`}
                aria-pressed={note.reaction === reaction}
                disabled={busy}
                onClick={() => void react(reaction)}
                className={cn(
                  "tap w-9 rounded-xl text-base transition-colors",
                  note.reaction === reaction
                    ? "bg-[var(--color-butter)]"
                    : "hover:bg-[var(--color-cream)]",
                )}
              >
                {reaction}
              </button>
            ))
          : note.reaction ? (
              <span className="text-base" aria-label="Reaksi dia">
                {note.reaction}
              </span>
            ) : null}

        <button
          type="button"
          onClick={() => void hide()}
          disabled={busy}
          aria-label="Hide this note from my list"
          className="tap ml-auto flex items-center justify-center rounded-xl px-2 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          <EyeOff className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}
