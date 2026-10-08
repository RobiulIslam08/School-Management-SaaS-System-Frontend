import { toast } from "sonner";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { PAGE_GROUPS, draftLines, pagePath, text, type PageBlock, type PageRow } from "@/components/website/copy";
import { PhotoField } from "@/components/website/photo-field";
import { SectionFrame } from "@/components/website/section-frame";
import { useI18n } from "@/lib/i18n";

export function PagesTab({
  pages,
  page,
  saving,
  onPick,
  onChange,
  onSave,
}: {
  pages: PageRow[];
  page: PageRow | null;
  saving: boolean;
  onPick: (id: string) => void;
  onChange: (next: PageRow) => void;
  onSave: () => void;
}) {
  const { t, locale } = useI18n();
  const known = new Set<string>(PAGE_GROUPS.map((group) => group.key));
  const extras = pages.filter((item) => !known.has(item.menuKey));

  function setBlock(index: number, block: PageBlock) {
    if (!page) return;
    const blocks = page.blocks.slice();
    blocks[index] = block;
    onChange({ ...page, blocks });
  }

  return (
    <SectionFrame title={page?.titleBn || t.website.pages} where={t.website.wherePages} href={page ? pagePath(page) : "/about"}>
      <Field label={t.website.pages}>
        <Select value={page?._id ?? ""} onChange={(event) => onPick(event.target.value)}>
          {PAGE_GROUPS.map((group) => {
            const rows = pages.filter((item) => item.menuKey === group.key);
            if (!rows.length) return null;
            return (
              <optgroup key={group.key} label={locale === "bn" ? group.bn : group.en}>
                {rows.map((item) => (
                  <option key={item._id} value={item._id}>{item.titleBn || item.slug}</option>
                ))}
              </optgroup>
            );
          })}
          {extras.length ? (
            <optgroup label={locale === "bn" ? "অন্যান্য" : "Other"}>
              {extras.map((item) => (
                <option key={item._id} value={item._id}>{item.titleBn || item.slug}</option>
              ))}
            </optgroup>
          ) : null}
        </Select>
      </Field>
      {page ? (
        <>
          <Field label="বাংলা"><Input value={page.titleBn} onChange={(event) => onChange({ ...page, titleBn: event.target.value })} /></Field>
          <Field label="English"><Input value={page.titleEn} onChange={(event) => onChange({ ...page, titleEn: event.target.value })} /></Field>
          <Field label={`${t.website.summary} · বাংলা`}>
            <Textarea value={page.summaryBn} onChange={(event) => onChange({ ...page, summaryBn: event.target.value })} />
          </Field>
          <Field label={`${t.website.summary} · English`}>
            <Textarea value={page.summaryEn} onChange={(event) => onChange({ ...page, summaryEn: event.target.value })} />
          </Field>
          {page.blocks.map((block, index) => {
            if (block.type === "image") {
              return (
                <PhotoField
                  key={`${page._id}-image-${index}`}
                  label={t.website.banner}
                  value={block.imageUrl ?? ""}
                  alt={block.alt ?? ""}
                  onChange={(url) => setBlock(index, { ...block, imageUrl: url })}
                  onAlt={(value) => setBlock(index, { ...block, alt: value })}
                />
              );
            }
            if (block.type === "list") {
              return (
                <div key={`${page._id}-list-${index}`} className="grid gap-2 sm:grid-cols-2">
                  <Field label={`${t.website.body} · বাংলা`}>
                    <Textarea value={(block.itemsBn ?? []).join("\n")} onChange={(event) => setBlock(index, { ...block, itemsBn: draftLines(event.target.value) })} />
                  </Field>
                  <Field label={`${t.website.body} · English`}>
                    <Textarea value={(block.itemsEn ?? []).join("\n")} onChange={(event) => setBlock(index, { ...block, itemsEn: draftLines(event.target.value) })} />
                  </Field>
                </div>
              );
            }
            const label = block.type === "heading" ? t.website.sections : index === 0 ? t.website.lead : t.website.body;
            return (
              <div key={`${page._id}-text-${index}`} className="grid gap-2 sm:grid-cols-2">
                <Field label={`${label} · বাংলা`}>
                  <Textarea value={block.textBn ?? ""} onChange={(event) => setBlock(index, { ...block, textBn: event.target.value })} />
                </Field>
                <Field label={`${label} · English`}>
                  <Textarea value={block.textEn ?? ""} onChange={(event) => setBlock(index, { ...block, textEn: event.target.value })} />
                </Field>
              </div>
            );
          })}
          <Field label={t.common.status}>
            <Select value={page.status} onChange={(event) => onChange({ ...page, status: event.target.value })}>
              <option value="draft">{t.website.draft}</option>
              <option value="published">{t.website.publish}</option>
            </Select>
          </Field>
          <Button
            type="button"
            disabled={saving}
            onClick={() => {
              const missingAlt = page.blocks.some((block) => block.type === "image" && text(block.imageUrl) && !text(block.alt).trim());
              if (page.status === "published" && missingAlt) {
                toast.error(t.website.alt);
                return;
              }
              onSave();
            }}
          >
            {t.common.save}
          </Button>
        </>
      ) : <p className="text-sm text-muted-foreground">{t.website.empty}</p>}
    </SectionFrame>
  );
}
