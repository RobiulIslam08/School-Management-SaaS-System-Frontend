import { Button, Field, Input, Textarea } from "@/components/ui";
import { asStats, asTasks, asWhy, text, type StatItem, type TaskItem, type WhyItem } from "@/components/website/copy";
import { PhotoField } from "@/components/website/photo-field";
import { SectionFrame } from "@/components/website/section-frame";
import { VideoField } from "@/components/website/video-field";
import { useI18n } from "@/lib/i18n";

export function HomeTab({
  form,
  setForm,
  saving,
  onSave,
}: {
  form: Record<string, unknown>;
  setForm: (next: Record<string, unknown>) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const { t } = useI18n();
  const why = asWhy(form.whyChooseUs);
  const stats = asStats(form.stats);
  const tasks = asTasks(form.tasks);

  function setWhy(next: WhyItem[]) {
    setForm({ ...form, whyChooseUs: next });
  }
  function setStats(next: StatItem[]) {
    setForm({ ...form, stats: next });
  }
  function setTasks(next: TaskItem[]) {
    setForm({ ...form, tasks: next });
  }

  return (
    <div className="max-w-3xl space-y-4">
      <SectionFrame title={t.website.hero} where={t.website.whereHero} href="/">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="বাংলা">
            <Input maxLength={80} value={text(form.heroTitleBn)} onChange={(event) => setForm({ ...form, heroTitleBn: event.target.value })} />
          </Field>
          <Field label="English">
            <Input maxLength={80} value={text(form.heroTitleEn)} onChange={(event) => setForm({ ...form, heroTitleEn: event.target.value })} />
          </Field>
          <Field label={`${t.website.body} · বাংলা`}>
            <Textarea maxLength={180} value={text(form.heroSubtitleBn)} onChange={(event) => setForm({ ...form, heroSubtitleBn: event.target.value })} />
          </Field>
          <Field label={`${t.website.body} · English`}>
            <Textarea maxLength={180} value={text(form.heroSubtitleEn)} onChange={(event) => setForm({ ...form, heroSubtitleEn: event.target.value })} />
          </Field>
        </div>
        <PhotoField label={t.website.photo} value={text(form.heroImageUrl)} onChange={(url) => setForm({ ...form, heroImageUrl: url })} />
      </SectionFrame>

      <SectionFrame title={t.website.video} where={t.website.whereFilm} href="/">
        <VideoField label={t.website.video} value={text(form.heroVideoUrl)} onChange={(url) => setForm({ ...form, heroVideoUrl: url })} />
      </SectionFrame>

      <SectionFrame title={t.website.intro} where={t.website.whereIntro} href="/">
        <p className="text-sm text-muted-foreground">{t.website.introHint}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="বাংলা">
            <Textarea maxLength={800} value={text(form.homeIntroBn)} onChange={(event) => setForm({ ...form, homeIntroBn: event.target.value })} />
          </Field>
          <Field label="English">
            <Textarea maxLength={800} value={text(form.homeIntroEn)} onChange={(event) => setForm({ ...form, homeIntroEn: event.target.value })} />
          </Field>
        </div>
      </SectionFrame>

      <SectionFrame title={t.website.tasks} where={t.website.whereTasks} href="/">
        {tasks.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
            <Input aria-label="বাংলা শিরোনাম" placeholder="বাংলা শিরোনাম" value={item.titleBn} onChange={(event) => {
              const next = tasks.slice();
              next[index] = { ...item, titleBn: event.target.value };
              setTasks(next);
            }} />
            <Input aria-label="English title" placeholder="English title" value={item.titleEn} onChange={(event) => {
              const next = tasks.slice();
              next[index] = { ...item, titleEn: event.target.value };
              setTasks(next);
            }} />
            <Input aria-label="বাংলা" placeholder="বাংলা" value={item.bodyBn} onChange={(event) => {
              const next = tasks.slice();
              next[index] = { ...item, bodyBn: event.target.value };
              setTasks(next);
            }} />
            <Input aria-label="English" placeholder="English" value={item.bodyEn} onChange={(event) => {
              const next = tasks.slice();
              next[index] = { ...item, bodyEn: event.target.value };
              setTasks(next);
            }} />
          </div>
        ))}
      </SectionFrame>

      <SectionFrame title={t.website.admit} where={t.website.whereAdmit} href="/">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="বাংলা">
            <Input maxLength={80} value={text(form.admitTitleBn)} onChange={(event) => setForm({ ...form, admitTitleBn: event.target.value })} />
          </Field>
          <Field label="English">
            <Input maxLength={80} value={text(form.admitTitleEn)} onChange={(event) => setForm({ ...form, admitTitleEn: event.target.value })} />
          </Field>
          <Field label={`${t.website.body} · বাংলা`}>
            <Textarea maxLength={240} value={text(form.admitBodyBn)} onChange={(event) => setForm({ ...form, admitBodyBn: event.target.value })} />
          </Field>
          <Field label={`${t.website.body} · English`}>
            <Textarea maxLength={240} value={text(form.admitBodyEn)} onChange={(event) => setForm({ ...form, admitBodyEn: event.target.value })} />
          </Field>
        </div>
      </SectionFrame>

      <SectionFrame title={t.website.why} where={t.website.whereWhy} href="/">
        {why.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
            <Input aria-label="বাংলা শিরোনাম" placeholder="বাংলা শিরোনাম" value={item.titleBn} onChange={(event) => {
              const next = why.slice();
              next[index] = { ...item, titleBn: event.target.value };
              setWhy(next);
            }} />
            <Input aria-label="English title" placeholder="English title" value={item.titleEn} onChange={(event) => {
              const next = why.slice();
              next[index] = { ...item, titleEn: event.target.value };
              setWhy(next);
            }} />
            <Input aria-label="বাংলা" placeholder="বাংলা" value={item.bodyBn} onChange={(event) => {
              const next = why.slice();
              next[index] = { ...item, bodyBn: event.target.value };
              setWhy(next);
            }} />
            <Input aria-label="English" placeholder="English" value={item.bodyEn} onChange={(event) => {
              const next = why.slice();
              next[index] = { ...item, bodyEn: event.target.value };
              setWhy(next);
            }} />
            <Button type="button" variant="secondary" onClick={() => setWhy(why.filter((_, itemIndex) => itemIndex !== index))}>{t.website.remove}</Button>
          </div>
        ))}
        {why.length < 6 ? (
          <Button type="button" variant="secondary" onClick={() => setWhy([...why, { titleBn: "", titleEn: "", bodyBn: "", bodyEn: "" }])}>{t.common.add}</Button>
        ) : null}
      </SectionFrame>

      <SectionFrame title={t.website.stats} where={t.website.whereStats} href="/">
        {stats.map((item, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
            <Input aria-label="বাংলা" placeholder="বাংলা" value={item.labelBn} onChange={(event) => {
              const next = stats.slice();
              next[index] = { ...item, labelBn: event.target.value };
              setStats(next);
            }} />
            <Input aria-label="English" placeholder="English" value={item.labelEn} onChange={(event) => {
              const next = stats.slice();
              next[index] = { ...item, labelEn: event.target.value };
              setStats(next);
            }} />
            <Input aria-label={t.website.value} placeholder={t.website.value} value={item.value} onChange={(event) => {
              const next = stats.slice();
              next[index] = { ...item, value: event.target.value };
              setStats(next);
            }} />
            <Button type="button" variant="secondary" onClick={() => setStats(stats.filter((_, itemIndex) => itemIndex !== index))}>{t.website.remove}</Button>
          </div>
        ))}
        {stats.length < 8 ? (
          <Button type="button" variant="secondary" onClick={() => setStats([...stats, { labelBn: "", labelEn: "", value: "" }])}>{t.common.add}</Button>
        ) : null}
      </SectionFrame>

      <SectionFrame title={t.website.principal} where={t.website.wherePrincipal} href="/">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label={t.common.name}>
            <Input value={text(form.principalName)} onChange={(event) => setForm({ ...form, principalName: event.target.value })} />
          </Field>
          <Field label={t.website.designation}>
            <Input value={text(form.principalDesignation)} onChange={(event) => setForm({ ...form, principalDesignation: event.target.value })} />
          </Field>
        </div>
        <PhotoField label={t.website.photo} value={text(form.principalPhotoUrl)} onChange={(url) => setForm({ ...form, principalPhotoUrl: url })} />
        <Field label={`${t.website.quote} · বাংলা`}>
          <Textarea maxLength={280} value={text(form.principalQuoteBn)} onChange={(event) => setForm({ ...form, principalQuoteBn: event.target.value })} />
        </Field>
        <Field label={`${t.website.quote} · English`}>
          <Textarea maxLength={280} value={text(form.principalQuoteEn)} onChange={(event) => setForm({ ...form, principalQuoteEn: event.target.value })} />
        </Field>
      </SectionFrame>
      <div className="sticky bottom-4">
        <Button type="button" disabled={saving} onClick={onSave}>{t.common.save}</Button>
      </div>
    </div>
  );
}
