"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form-field";
import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { NOTE_REACTIONS, sendLoveNote } from "@/services/love-note-service";
import { LOVE_NOTE_MAX_LENGTH } from "@/types/relationship";
import { PARTNER } from "@/lib/copy";
import { cn } from "@/lib/utils/cn";

export function LoveNoteComposer({ onSent }: { onSent?: () => void }) {
  const { user } = useAuthContext();
  const { relationship } = useRelationship();
  const [message, setMessage] = useState("");
  const [emoji, setEmoji] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!relationship || !user || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendLoveNote(relationship.id, user.uid, message, emoji);
      setMessage("");
      setEmoji(undefined);
      setSent(true);
      onSent?.();
    } catch {
      setError("Couldn't send your note. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const remaining = LOVE_NOTE_MAX_LENGTH - message.length;

  return (
    <div className="card space-y-3 p-5">
      <FormError message={error} />
      <FormSuccess message={sent ? "Sent 🌻" : null} />

      <div>
        <label htmlFor="love-note" className="mb-1.5 block text-sm font-medium">
          Your note
        </label>
        <textarea
          id="love-note"
          rows={3}
          maxLength={LOVE_NOTE_MAX_LENGTH}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setSent(false);
          }}
          placeholder={PARTNER.notePlaceholder}
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-[15px] leading-relaxed outline-none focus:border-[var(--color-primary-deep)]"
        />
        <p className="mt-1 text-right text-xs text-[var(--color-muted)]">
          {remaining} characters left
        </p>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">
          {PARTNER.noteFeeling}
        </legend>
        <div className="flex gap-2">
          {NOTE_REACTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Tambahin ${option}`}
              aria-pressed={emoji === option}
              onClick={() => setEmoji(emoji === option ? undefined : option)}
              className={cn(
                "tap w-11 rounded-2xl border text-lg transition-colors",
                emoji === option
                  ? "border-[var(--color-primary-deep)] bg-[var(--color-butter)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)]",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <Button
        fullWidth
        disabled={!message.trim()}
        loading={sending}
        onClick={() => void send()}
      >
        <Send className="h-4 w-4" aria-hidden />
        {PARTNER.sendNote}
      </Button>
    </div>
  );
}
