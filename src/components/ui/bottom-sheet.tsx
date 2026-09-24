"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { STATES } from "@/lib/copy";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Mobile-friendly sheet for short choices, with focus trapping and Escape. */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={STATES.close}
        onClick={onClose}
        className="absolute inset-0 bg-[var(--color-ink)]/25"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="animate-rise relative w-full max-w-md rounded-t-3xl bg-[var(--color-surface)] p-5 pb-8 shadow-[var(--shadow-lift)] outline-none sm:rounded-3xl sm:pb-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={STATES.close}
            className="tap -mr-2 flex items-center justify-center rounded-2xl text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Lanjut",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <BottomSheet open={open} title={title} onClose={onCancel}>
      <p className="text-sm leading-relaxed text-[var(--color-muted)]">{description}</p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="tap flex-1 rounded-2xl border border-[var(--color-line)] text-sm font-medium"
        >
          {STATES.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={
            destructive
              ? "tap flex-1 rounded-2xl bg-[var(--color-error)] text-sm font-medium text-white"
              : "tap flex-1 rounded-2xl bg-[var(--color-primary)] text-sm font-medium text-[var(--color-ink)]"
          }
        >
          {confirmLabel}
        </button>
      </div>
    </BottomSheet>
  );
}
