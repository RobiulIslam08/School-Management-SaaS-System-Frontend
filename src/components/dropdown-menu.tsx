"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";
import { useI18n } from "@/lib/i18n";

export type MenuAction = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

export function DropdownMenu({
  actions,
  label,
}: {
  actions: MenuAction[];
  label?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!actions.length) return null;

  return (
    <div className="relative" ref={ref}>
      <Button type="button" variant="secondary" className="h-9 px-3" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {label ?? t.common.actions}
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 min-w-40 rounded-xl border border-border bg-white py-1 shadow-md">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={cn(
                "flex h-10 w-full items-center px-3 text-left text-sm hover:bg-muted",
                action.danger && "text-red-700"
              )}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
