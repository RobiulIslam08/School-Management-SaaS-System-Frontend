"use client";

import { cn } from "@/lib/utils";

export function WorkspaceTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="no-print mb-6 inline-flex flex-wrap rounded-md border border-border bg-white p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            "h-10 rounded px-4 text-sm font-medium",
            active === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
