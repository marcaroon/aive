"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form-field";
import { useRelationship } from "@/contexts/relationship-context";
import { sendSupportRequest } from "@/services/support-request-service";
import {
  SUPPORT_REQUEST_LABELS,
  SUPPORT_REQUEST_TYPES,
  type SupportRequestType,
} from "@/types/relationship";
import { SUPPORT } from "@/lib/copy";
import { cn } from "@/lib/utils/cn";

export function SupportRequestComposer() {
  const { relationship, permissions } = useRelationship();
  const [selected, setSelected] = useState<SupportRequestType | null>(null);
  const [custom, setCustom] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!relationship || !selected) return;
    if (selected === "Custom message" && !custom.trim()) {
      setError("Write your message first.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendSupportRequest(
        relationship.id,
        selected,
        selected === "Custom message" ? custom : undefined,
      );
      setSent(true);
      setSelected(null);
      setCustom("");
    } catch {
      setError("Couldn't send that. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card space-y-4 p-5">
      <FormError message={error} />
      <FormSuccess message={sent ? SUPPORT.sent : null} />

      {!permissions.shareSupportRequest ? (
        <p className="text-xs text-[var(--color-muted)]">{SUPPORT.off}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {[...SUPPORT_REQUEST_TYPES, "Custom message" as const].map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={selected === type}
            onClick={() => {
              setSelected(type);
              setSent(false);
            }}
            className={cn(
              "tap rounded-2xl border px-3.5 text-sm font-medium transition-colors",
              selected === type
                ? "border-[var(--color-primary-deep)] bg-[var(--color-butter)]"
                : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-cream)]",
            )}
          >
            {SUPPORT_REQUEST_LABELS[type]}
          </button>
        ))}
      </div>

      {selected === "Custom message" ? (
        <div>
          <label
            htmlFor="support-message"
            className="mb-1.5 block text-sm font-medium"
          >
            {SUPPORT.customLabel}
          </label>
          <textarea
            id="support-message"
            rows={3}
            maxLength={200}
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-[15px] outline-none focus:border-[var(--color-primary-deep)]"
          />
        </div>
      ) : null}

      <Button
        fullWidth
        disabled={!selected}
        loading={sending}
        onClick={() => void send()}
      >
        <Send className="h-4 w-4" aria-hidden />
        {SUPPORT.send}
      </Button>
    </div>
  );
}
