"use client";

import { Field, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

const HOSTS = new Set(["youtube.com", "youtu.be", "m.youtube.com", "facebook.com", "fb.watch"]);

export function isVideoLink(value: string): boolean {
  const raw = value.trim();
  if (!raw) return true;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && HOSTS.has(url.hostname.replace(/^www\./, ""));
  } catch {
    return false;
  }
}

function youtubeId(value: string): string {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] ?? "";
    if (host !== "youtube.com" && host !== "m.youtube.com") return "";
    const watch = url.searchParams.get("v");
    if (watch) return watch;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") return parts[1] ?? "";
  } catch {
    return "";
  }
  return "";
}

export function youtubeThumb(value: string): string {
  const id = youtubeId(value);
  if (id && /^[\w-]{6,}$/.test(id)) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return "";
}

export function VideoField({
  label,
  value,
  caption,
  onChange,
  onCaption,
}: {
  label: string;
  value: string;
  caption?: string;
  onChange: (value: string) => void;
  onCaption?: (value: string) => void;
}) {
  const { t } = useI18n();
  const thumb = youtubeThumb(value);
  const bad = Boolean(value.trim()) && !isVideoLink(value);
  return (
    <div className="space-y-2">
      <Field label={label}>
        <Input value={value} placeholder="https://www.youtube.com/watch?v=" onChange={(event) => onChange(event.target.value)} />
      </Field>
      <p className={bad ? "text-xs text-red-600" : "text-xs text-muted-foreground"}>{bad ? t.website.videoBad : t.website.videoHint}</p>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="aspect-video w-full max-w-sm rounded-md object-cover" />
      ) : null}
      {value.trim() && isVideoLink(value) && !thumb ? (
        <p className="text-sm text-muted-foreground">Facebook</p>
      ) : null}
      {onCaption ? (
        <Field label={t.website.caption}>
          <Input value={caption ?? ""} onChange={(event) => onCaption(event.target.value)} />
        </Field>
      ) : null}
    </div>
  );
}
