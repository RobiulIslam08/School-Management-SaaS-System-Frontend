import type { ReactNode } from "react";
import { Button } from "./ui";
import { useI18n } from "@/lib/i18n";

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

/** Thin bar while RTK refetches with cached rows still visible. */
export function SoftFetchBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="mb-2 h-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
      <div className="h-full w-1/3 animate-pulse bg-primary/50" />
    </div>
  );
}

export function QueryError({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm">
      <p className="font-medium text-red-800">{message ?? t.common.loadError}</p>
      {onRetry ? (
        <Button className="mt-3" variant="secondary" onClick={onRetry}>
          {t.common.retry}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
