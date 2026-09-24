"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FormError, TextField } from "@/components/ui/form-field";
import { FlowSelector } from "./flow-selector";
import { periodRangeSchema, type PeriodRangeValues } from "@/lib/validation/schemas";
import { CYCLE } from "@/lib/copy";
import type { PeriodFlowLevel } from "@/types/cycle";
import type { DateKey } from "@/lib/utils/date";

interface PeriodLogFormProps {
  defaultStartDate: DateKey;
  defaultEndDate?: DateKey;
  onSave: (values: PeriodRangeValues) => Promise<void>;
  onRemove?: () => Promise<void>;
}

export function PeriodLogForm({
  defaultStartDate,
  defaultEndDate,
  onSave,
  onRemove,
}: PeriodLogFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PeriodRangeValues>({
    resolver: zodResolver(periodRangeSchema),
    defaultValues: {
      startDate: defaultStartDate,
      endDate: defaultEndDate ?? "",
      flowLevel: "medium",
    },
  });

  const flowLevel = watch("flowLevel");

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSave(values);
    } catch {
      setFormError("Couldn't save your period. Check your connection and try again.");
    }
  });

  const handleRemove = async () => {
    if (!onRemove) return;
    setRemoving(true);
    setFormError(null);
    try {
      await onRemove();
    } catch {
      setFormError("Couldn't delete your period. Try again.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={formError} />

      <TextField
        label="Period start"
        type="date"
        error={errors.startDate?.message}
        {...register("startDate")}
      />
      <TextField
        label="Period end"
        type="date"
        hint={CYCLE.stillGoing}
        error={errors.endDate?.message}
        {...register("endDate")}
      />

      <FlowSelector
        value={flowLevel}
        onChange={(value) => setValue("flowLevel", value as PeriodFlowLevel)}
        excludeNone
      />

      <div className="flex gap-3 pt-1">
        {onRemove ? (
          <Button type="button" variant="secondary" onClick={handleRemove} loading={removing}>
            {CYCLE.removePeriod}
          </Button>
        ) : null}
        <Button type="submit" fullWidth loading={isSubmitting}>
          {CYCLE.savePeriod}
        </Button>
      </div>
    </form>
  );
}
