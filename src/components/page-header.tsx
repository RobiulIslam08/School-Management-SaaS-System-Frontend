import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
  actions,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  actions?: ReactNode;
}) {
  const slot = actions ?? action;
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {slot ? <div className="flex flex-wrap items-center gap-2">{slot}</div> : null}
    </div>
  );
}
