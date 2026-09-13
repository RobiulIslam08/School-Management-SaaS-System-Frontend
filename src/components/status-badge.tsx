import { Badge } from "./ui";
import { cn } from "@/lib/utils";

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  return (
    <Badge
      className={cn(
        tone === "success" && "bg-emerald-50 text-emerald-800",
        tone === "danger" && "bg-red-50 text-red-800",
        tone === "warning" && "bg-amber-50 text-amber-800"
      )}
    >
      {label}
    </Badge>
  );
}
