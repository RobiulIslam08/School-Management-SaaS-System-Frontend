import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  href,
  label,
  value,
  icon,
  trend,
  tone = "neutral",
}: {
  href?: string;
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-red-700"
        : tone === "warning"
          ? "text-amber-700"
          : "text-foreground";

  const className = cn(
    "block rounded-xl border border-border bg-white p-5 shadow-sm",
    href && "transition duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  );

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", toneClass)}>{value}</p>
      {trend ? <p className="mt-1 text-xs text-muted-foreground">{trend}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
