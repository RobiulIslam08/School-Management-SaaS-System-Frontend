"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = (elParam?: HTMLElement | null) => {
    const el = elParam ?? triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuHeight = actions.length * 40 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const fitsBelow = spaceBelow >= menuHeight || spaceBelow >= 110;
    const right = Math.max(8, window.innerWidth - rect.right);

    if (fitsBelow) {
      setPosition({
        top: rect.bottom + 4,
        right,
      });
    } else {
      setPosition({
        bottom: window.innerHeight - rect.top + 4,
        right,
      });
    }
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const onScrollOrResize = () => setOpen(false);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, actions.length]);

  if (!actions.length) return null;

  return (
    <>
      <div ref={triggerRef} className="inline-block">
        <Button
          type="button"
          variant="secondary"
          className="h-9 px-3"
          aria-expanded={open}
          onClick={(e) => {
            if (!open) updatePosition(e.currentTarget);
            setOpen((v) => !v);
          }}
        >
          {label ?? t.common.actions}
        </Button>
      </div>

      {mounted && open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: position.top !== undefined ? `${position.top}px` : "auto",
                bottom: position.bottom !== undefined ? `${position.bottom}px` : "auto",
                right: `${position.right}px`,
                zIndex: 9999,
              }}
              className="min-w-40 rounded-xl border border-border bg-white py-1 shadow-xl animate-in fade-in zoom-in-95 duration-100"
            >
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={cn(
                    "flex h-10 w-full items-center px-3.5 text-left text-sm font-medium transition hover:bg-muted text-foreground",
                    action.danger && "text-red-600 hover:bg-red-50 hover:text-red-700"
                  )}
                  onClick={() => {
                    setOpen(false);
                    action.onClick();
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
