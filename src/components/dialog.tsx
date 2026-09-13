"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";
import { useI18n } from "@/lib/i18n";

export function Dialog({
  open,
  title,
  children,
  onClose,
  className,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-foreground/40" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-md",
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-medium">{title}</h2>
          <Button type="button" variant="ghost" className="h-9 px-2" onClick={onClose}>
            ×
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Sheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-foreground/40" aria-label="Close" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto border-l border-border bg-white p-5 shadow-md"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-medium">{title}</h2>
          <Button type="button" variant="ghost" className="h-9 px-2" onClick={onClose}>
            ×
          </Button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t.common.cancel}
        </Button>
        <Button type="button" variant={danger ? "danger" : "primary"} disabled={busy} onClick={onConfirm}>
          {confirmLabel ?? t.common.delete}
        </Button>
      </div>
    </Dialog>
  );
}
