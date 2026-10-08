import { useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { text } from "@/components/website/copy";
import { PhotoField } from "@/components/website/photo-field";
import { SectionFrame } from "@/components/website/section-frame";
import type { WebsiteBundle } from "@/lib/api/websiteApi";
import { useI18n } from "@/lib/i18n";

const EMPTY = {
  id: "",
  kind: "news",
  titleBn: "",
  titleEn: "",
  bodyBn: "",
  bodyEn: "",
  coverUrl: "",
  coverAlt: "",
  eventDate: "",
  pinned: false,
  status: "published",
  seoDescriptionBn: "",
  seoDescriptionEn: "",
};

function day(value: unknown): string {
  const raw = text(value);
  if (!raw) return "";
  return raw.slice(0, 10);
}

export function NewsTab({
  bundle,
  saving,
  onSave,
  onDelete,
}: {
  bundle: WebsiteBundle;
  saving: boolean;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const kinds = [
    { key: "news", bn: "খবর", en: "News" },
    { key: "event", bn: "অনুষ্ঠান", en: "Event" },
    { key: "program", bn: "কার্যক্রম", en: "Programme" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionFrame title={t.website.news} where={t.website.whereNews} href="/news">
        <Field label={t.website.kind}>
          <Select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
            {kinds.map((kind) => (
              <option key={kind.key} value={kind.key}>{locale === "bn" ? kind.bn : kind.en}</option>
            ))}
          </Select>
        </Field>
        <Field label="বাংলা"><Input value={form.titleBn} onChange={(event) => setForm({ ...form, titleBn: event.target.value })} /></Field>
        <Field label="English"><Input value={form.titleEn} onChange={(event) => setForm({ ...form, titleEn: event.target.value })} /></Field>
        <Field label={`${t.website.body} · বাংলা`}><Textarea value={form.bodyBn} onChange={(event) => setForm({ ...form, bodyBn: event.target.value })} /></Field>
        <Field label={`${t.website.body} · English`}><Textarea value={form.bodyEn} onChange={(event) => setForm({ ...form, bodyEn: event.target.value })} /></Field>
        <PhotoField
          label={t.website.cover}
          value={form.coverUrl}
          alt={form.coverAlt}
          onChange={(url) => setForm({ ...form, coverUrl: url })}
          onAlt={(value) => setForm({ ...form, coverAlt: value })}
        />
        <Field label={t.website.eventDate}>
          <Input type="date" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.pinned} onChange={(event) => setForm({ ...form, pinned: event.target.checked })} />
          {t.website.pinned}
        </label>
        <Field label={t.common.status}>
          <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="draft">{t.website.draft}</option>
            <option value="published">{t.website.publish}</option>
          </Select>
        </Field>
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={saving || !(form.titleBn.trim() || form.titleEn.trim())}
            onClick={async () => {
              if (form.status === "published" && form.coverUrl && !form.coverAlt.trim()) {
                toast.error(t.website.alt);
                return;
              }
              const ok = await onSave({
                id: form.id || undefined,
                kind: form.kind,
                titleBn: form.titleBn,
                titleEn: form.titleEn,
                bodyBn: form.bodyBn,
                bodyEn: form.bodyEn,
                coverUrl: form.coverUrl,
                coverAlt: form.coverAlt,
                eventDate: form.eventDate || undefined,
                pinned: form.pinned,
                status: form.status,
                seoDescriptionBn: form.seoDescriptionBn,
                seoDescriptionEn: form.seoDescriptionEn,
              });
              if (ok && !form.id) setForm(EMPTY);
            }}
          >
            {form.id ? t.common.save : t.common.add}
          </Button>
          {form.id ? <Button type="button" variant="secondary" onClick={() => setForm(EMPTY)}>{t.common.cancel}</Button> : null}
        </div>
      </SectionFrame>
      <SectionFrame title={t.website.news} where={t.website.whereNews} href="/news">
        <ul className="divide-y divide-border text-sm">
          {bundle.posts.length ? bundle.posts.map((item) => (
            <li key={text(item._id)} className="flex items-center justify-between gap-3 py-3">
              <span>{text(item.titleBn) || text(item.titleEn)}</span>
              <span className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setForm({
                    id: text(item._id),
                    kind: text(item.kind) || "news",
                    titleBn: text(item.titleBn),
                    titleEn: text(item.titleEn),
                    bodyBn: text(item.bodyBn),
                    bodyEn: text(item.bodyEn),
                    coverUrl: text(item.coverUrl),
                    coverAlt: text(item.coverAlt),
                    eventDate: day(item.eventDate),
                    pinned: item.pinned === true,
                    status: text(item.status) || "published",
                    seoDescriptionBn: text(item.seoDescriptionBn),
                    seoDescriptionEn: text(item.seoDescriptionEn),
                  })}
                >
                  {t.common.edit}
                </Button>
                <Button type="button" variant="secondary" onClick={() => onDelete(text(item._id))}>{t.common.delete}</Button>
              </span>
            </li>
          )) : <li className="py-2 text-muted-foreground">{t.website.empty}</li>}
        </ul>
      </SectionFrame>
    </div>
  );
}

export function InquiriesTab({
  bundle,
  onRead,
}: {
  bundle: WebsiteBundle;
  onRead: (id: string) => Promise<boolean>;
}) {
  const { t } = useI18n();
  return (
    <SectionFrame title={t.website.inquiries} where={t.website.whereInquiries}>
      <ul className="divide-y divide-border text-sm">
        {bundle.inquiries.length ? bundle.inquiries.map((item) => (
          <li key={text(item._id)} className="py-3">
            <p className="font-medium">{text(item.name)} · {text(item.phone)}</p>
            <p className="mt-1 text-muted-foreground">{text(item.message)}</p>
            {item.read ? null : (
              <Button type="button" variant="secondary" className="mt-2" onClick={() => onRead(text(item._id))}>{t.website.markRead}</Button>
            )}
          </li>
        )) : <li className="py-2 text-muted-foreground">{t.website.empty}</li>}
      </ul>
    </SectionFrame>
  );
}
