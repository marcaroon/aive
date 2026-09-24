"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { enUS as enLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-field";
import { useRelationship } from "@/contexts/relationship-context";
import {
  PARTNER_RESPONSES,
  updateRequestStatus,
} from "@/services/support-request-service";
import {
  SUPPORT_REQUEST_LABELS,
  SUPPORT_STATUS_LABELS,
  type SupportRequest,
} from "@/types/relationship";

const STATUS_LABELS = SUPPORT_STATUS_LABELS;

export function SupportRequestCard({
  request,
  onChanged,
}: {
  request: SupportRequest;
  onChanged: () => void;
}) {
  const { relationship } = useRelationship();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mark as seen the moment it is on screen, so she knows it reached you.
  useEffect(() => {
    if (!relationship || request.status !== "sent") return;
    void updateRequestStatus(relationship.id, request.id, "seen").then(
      onChanged,
    );
  }, [relationship, request.id, request.status, onChanged]);

  const respond = async (response: string) => {
    if (!relationship) return;
    setBusy(true);
    setError(null);
    try {
      await updateRequestStatus(
        relationship.id,
        request.id,
        "acknowledged",
        response,
      );
      onChanged();
    } catch {
      setError("Couldn't send your reply. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const resolve = async () => {
    if (!relationship) return;
    setBusy(true);
    try {
      await updateRequestStatus(relationship.id, request.id, "resolved");
      onChanged();
    } catch {
      setError("Couldn't update that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium">
          {SUPPORT_REQUEST_LABELS[request.type] ?? request.type}
        </p>
        <span className="shrink-0 rounded-full bg-[var(--color-butter)] px-2.5 py-1 text-xs font-medium">
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      {request.message ? (
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
          {request.message}
        </p>
      ) : null}

      {request.createdAt ? (
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {formatDistanceToNow(request.createdAt.toDate(), {
            addSuffix: true,
            locale: enLocale,
          })}
        </p>
      ) : null}

      <FormError message={error} />

      {request.response ? (
        <p className="mt-3 rounded-2xl bg-[var(--color-cream)] px-4 py-3 text-sm">
          You replied: {request.response}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {request.status !== "acknowledged" && request.status !== "resolved"
          ? PARTNER_RESPONSES.map((response) => (
              <Button
                key={response}
                size="sm"
                loading={busy}
                onClick={() => void respond(response)}
              >
                {response}
              </Button>
            ))
          : null}

        {request.status !== "resolved" ? (
          <Button
            size="sm"
            variant="secondary"
            loading={busy}
            onClick={() => void resolve()}
          >
            Mark as done
          </Button>
        ) : null}
      </div>
    </article>
  );
}
