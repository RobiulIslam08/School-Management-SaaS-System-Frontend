"use client";

import { useRef, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { readImage } from "@/components/website/copy";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PhotoField({
  label,
  value,
  alt,
  onChange,
  onAlt,
}: {
  label: string;
  value: string;
  alt?: string;
  onChange: (url: string) => void;
  onAlt?: (value: string) => void;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  async function take(file: File | undefined) {
    if (!file) return;
    const url = await readImage(file, t.website.photoTooBig);
    if (url) onChange(url);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <button
        type="button"
        aria-label={label}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-center",
          over && "border-primary bg-muted"
        )}
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void take(event.dataTransfer.files?.[0]);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={alt || ""} className="max-h-48 w-full rounded-md object-contain" />
        ) : (
          <span className="text-sm text-muted-foreground">{t.website.dropPhoto}</span>
        )}
        <span className="text-xs text-muted-foreground">{t.website.photoHint}</span>
      </button>
      <input
        ref={input}
        aria-label={label}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void take(file);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => input.current?.click()}>
          {value ? t.website.replace : t.website.dropPhoto}
        </Button>
        {value ? (
          <Button type="button" variant="secondary" onClick={() => onChange("")}>
            {t.website.remove}
          </Button>
        ) : null}
      </div>
      {onAlt ? (
        <Field label={t.website.alt}>
          <Input value={alt ?? ""} onChange={(event) => onAlt(event.target.value)} />
        </Field>
      ) : null}
    </div>
  );
}
