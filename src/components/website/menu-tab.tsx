import { Button, Input } from "@/components/ui";
import { asMenus, type MenuChild } from "@/components/website/copy";
import { SectionFrame } from "@/components/website/section-frame";
import { useI18n } from "@/lib/i18n";

export function MenuTab({
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
  const menus = asMenus(form.menus);

  function patch(index: number, childIndex: number | null, patchItem: Partial<MenuChild>) {
    const next = menus.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (childIndex === null) return { ...item, ...patchItem };
      return {
        ...item,
        children: item.children.map((child, indexChild) => (indexChild === childIndex ? { ...child, ...patchItem } : child)),
      };
    });
    setForm({ ...form, menus: next });
  }

  return (
    <SectionFrame title={t.website.menu} where={t.website.whereMenu} href="/">
      {menus.map((item, index) => (
        <div key={item.key} className="space-y-3 rounded-md border border-border p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={item.visible !== false}
              disabled={Boolean(item.locked)}
              onChange={(event) => patch(index, null, { visible: event.target.checked })}
            />
            {item.labelBn || item.key}
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input aria-label={`${item.key} বাংলা`} value={item.labelBn} onChange={(event) => patch(index, null, { labelBn: event.target.value })} />
            <Input aria-label={`${item.key} English`} value={item.labelEn} onChange={(event) => patch(index, null, { labelEn: event.target.value })} />
          </div>
          {item.children.map((child, childIndex) => (
            <div key={child.key} className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[auto_1fr_1fr]">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={child.visible !== false} onChange={(event) => patch(index, childIndex, { visible: event.target.checked })} />
                {child.labelBn || child.key}
              </label>
              <Input aria-label={`${child.key} বাংলা`} value={child.labelBn} onChange={(event) => patch(index, childIndex, { labelBn: event.target.value })} />
              <Input aria-label={`${child.key} English`} value={child.labelEn} onChange={(event) => patch(index, childIndex, { labelEn: event.target.value })} />
            </div>
          ))}
        </div>
      ))}
      <Button type="button" disabled={saving} onClick={onSave}>{t.common.save}</Button>
    </SectionFrame>
  );
}
