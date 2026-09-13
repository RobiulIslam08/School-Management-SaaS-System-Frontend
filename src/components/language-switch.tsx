"use client";

import { useI18n, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const options: Array<{ id: Locale; label: string }> = [
    { id: "bn", label: "বাং" },
    { id: "en", label: "EN" },
  ];

  return (
    <div
      className={cn("inline-flex h-11 overflow-hidden rounded-md border border-border bg-white", className)}
      role="group"
      aria-label={t.common.language}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={locale === option.id}
          className={cn(
            "min-w-11 px-3 text-sm font-medium transition",
            locale === option.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          )}
          onClick={() => setLocale(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
