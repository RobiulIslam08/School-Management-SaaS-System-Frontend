import Link from "next/link";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { text } from "@/components/website/copy";
import { SectionFrame } from "@/components/website/section-frame";
import { useI18n } from "@/lib/i18n";

export function ReadyTab({
  form,
  setForm,
  settingsOk,
  saving,
  onSave,
}: {
  form: Record<string, unknown>;
  setForm: (next: Record<string, unknown>) => void;
  settingsOk: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const { t } = useI18n();
  const checks = [
    { ok: settingsOk, label: t.common.logo },
    { ok: Boolean(text(form.phone)), label: t.common.phone },
    { ok: Boolean(text(form.heroTitleBn) || text(form.heroTitleEn)), label: t.website.hero },
    { ok: Boolean(text(form.principalQuoteBn) || text(form.principalQuoteEn)), label: t.website.quote },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-4">
      <SectionFrame title={t.website.ready} where={t.website.whereReady} href="/contact">
        <Field label={t.common.phone}>
          <Input value={text(form.phone)} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
        <Field label={t.common.email}>
          <Input value={text(form.email)} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label={t.website.hours}>
          <Input value={text(form.officeHours)} onChange={(event) => setForm({ ...form, officeHours: event.target.value })} />
        </Field>
        <Field label={t.website.map}>
          <Input value={text(form.mapEmbedUrl)} onChange={(event) => setForm({ ...form, mapEmbedUrl: event.target.value })} />
        </Field>
        <Field label="Facebook">
          <Input value={text(form.facebook)} onChange={(event) => setForm({ ...form, facebook: event.target.value })} />
        </Field>
        <Field label="YouTube">
          <Input value={text(form.youtube)} onChange={(event) => setForm({ ...form, youtube: event.target.value })} />
        </Field>
      </SectionFrame>
      <SectionFrame title={t.website.preset} where={t.website.whereTheme} href="/">
        <Field label={t.website.preset}>
          <Select value={text(form.themePreset) || "heritage"} onChange={(event) => setForm({ ...form, themePreset: event.target.value })}>
            <option value="heritage">Heritage</option>
            <option value="royal">Royal</option>
            <option value="crimson">Crimson</option>
            <option value="azure">Azure</option>
            <option value="custom">Custom</option>
          </Select>
        </Field>
        {form.themePreset === "custom" ? (
          <Field label={t.website.color}>
            <Input type="color" value={text(form.themePrimary) || "#14532d"} onChange={(event) => setForm({ ...form, themePrimary: event.target.value })} />
          </Field>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.resultLookupEnabled !== false} onChange={(event) => setForm({ ...form, resultLookupEnabled: event.target.checked })} />
          {t.website.resultToggle}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.meritListEnabled === true} onChange={(event) => setForm({ ...form, meritListEnabled: event.target.checked })} />
          {t.website.meritToggle}
        </label>
        <p className="text-sm text-muted-foreground">{t.website.noticesHint}</p>
        <Button type="button" disabled={saving} onClick={onSave}>{t.common.save}</Button>
      </SectionFrame>
      </div>
      <Card className="space-y-3">
        <ul className="space-y-2 text-sm">
          {checks.map((item) => (
            <li key={item.label} className={item.ok ? "text-primary" : "text-muted-foreground"}>
              {item.ok ? "●" : "○"} {item.label}
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium">{t.website.links}</p>
        <ul className="space-y-2 text-sm">
          <li><Link className="text-primary underline" href="/settings">{t.nav.settings}</Link></li>
          <li><Link className="text-primary underline" href="/notices">{t.nav.notices}</Link></li>
          <li><Link className="text-primary underline" href="/teachers">{t.nav.teachers}</Link></li>
          <li><Link className="text-primary underline" href="/classes">{t.nav.classes}</Link></li>
        </ul>
      </Card>
    </div>
  );
}
