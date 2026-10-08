import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { BOARDS, asDesks, draftLines, personPath, text, type DeskItem } from "@/components/website/copy";
import { PhotoField } from "@/components/website/photo-field";
import { SectionFrame } from "@/components/website/section-frame";
import type { WebsiteBundle } from "@/lib/api/websiteApi";
import { useI18n } from "@/lib/i18n";

const EMPTY = { id: "", board: "principal", name: "", designation: "", phone: "", bioBn: "", bioEn: "", photoUrl: "" };

export function PeopleTab({
  bundle,
  form,
  setForm,
  saving,
  savingPerson,
  onSaveConfig,
  onSavePerson,
  onDelete,
}: {
  bundle: WebsiteBundle;
  form: Record<string, unknown>;
  setForm: (next: Record<string, unknown>) => void;
  saving: boolean;
  savingPerson: boolean;
  onSaveConfig: () => void;
  onSavePerson: (body: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const desks = asDesks(form.desks);
  const [deskKey, setDeskKey] = useState<string>(BOARDS[0].key);
  const [person, setPerson] = useState(EMPTY);
  const desk = desks.find((item) => item.key === deskKey) ?? desks[0];
  const people = bundle.people.filter((item) => text(item.board) === deskKey);

  function patchDesk(patch: Partial<DeskItem>) {
    setForm({
      ...form,
      desks: desks.map((item) => (item.key === deskKey ? { ...item, ...patch } : item)),
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionFrame title={t.website.note} where={t.website.wherePeople} href={personPath(deskKey)}>
        <Field label={t.website.people}>
          <Select value={deskKey} onChange={(event) => setDeskKey(event.target.value)}>
            {BOARDS.map((board) => (
              <option key={board.key} value={board.key}>{locale === "bn" ? board.bn : board.en}</option>
            ))}
          </Select>
        </Field>
        <Field label={`${t.website.note} · বাংলা`}>
          <Textarea value={desk?.noteBn ?? ""} onChange={(event) => patchDesk({ noteBn: event.target.value })} />
        </Field>
        <Field label={`${t.website.note} · English`}>
          <Textarea value={desk?.noteEn ?? ""} onChange={(event) => patchDesk({ noteEn: event.target.value })} />
        </Field>
        <Field label={`${t.website.duties} · বাংলা`}>
          <Textarea value={(desk?.dutiesBn ?? []).join("\n")} onChange={(event) => patchDesk({ dutiesBn: draftLines(event.target.value) })} />
        </Field>
        <Field label={`${t.website.duties} · English`}>
          <Textarea value={(desk?.dutiesEn ?? []).join("\n")} onChange={(event) => patchDesk({ dutiesEn: draftLines(event.target.value) })} />
        </Field>
        <Field label={`${t.website.visit} · বাংলা`}>
          <Textarea value={(desk?.visitBn ?? []).join("\n")} onChange={(event) => patchDesk({ visitBn: draftLines(event.target.value) })} />
        </Field>
        <Field label={`${t.website.visit} · English`}>
          <Textarea value={(desk?.visitEn ?? []).join("\n")} onChange={(event) => patchDesk({ visitEn: draftLines(event.target.value) })} />
        </Field>
        <Button type="button" disabled={saving} onClick={onSaveConfig}>{t.common.save}</Button>
      </SectionFrame>
      <SectionFrame title={t.website.people} where={t.website.wherePeople} href={personPath(deskKey)}>
        <Field label={t.common.name}><Input value={person.name} onChange={(event) => setPerson({ ...person, name: event.target.value })} /></Field>
        <Field label={t.website.designation}><Input value={person.designation} onChange={(event) => setPerson({ ...person, designation: event.target.value })} /></Field>
        <Field label={t.common.phone}><Input value={person.phone} onChange={(event) => setPerson({ ...person, phone: event.target.value })} /></Field>
        <Field label={`${t.website.body} · বাংলা`}><Textarea value={person.bioBn} onChange={(event) => setPerson({ ...person, bioBn: event.target.value })} /></Field>
        <Field label={`${t.website.body} · English`}><Textarea value={person.bioEn} onChange={(event) => setPerson({ ...person, bioEn: event.target.value })} /></Field>
        <PhotoField label={t.website.photo} value={person.photoUrl} onChange={(url) => setPerson({ ...person, photoUrl: url })} />
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={savingPerson || person.name.trim().length < 2}
            onClick={async () => {
              const ok = await onSavePerson({
                id: person.id || undefined,
                board: deskKey,
                name: person.name.trim(),
                designation: person.designation,
                phone: person.phone,
                bioBn: person.bioBn,
                bioEn: person.bioEn,
                photoUrl: person.photoUrl,
                status: "published",
              });
              if (ok) setPerson({ ...EMPTY, board: deskKey });
            }}
          >
            {person.id ? t.common.save : t.common.add}
          </Button>
          {person.id ? <Button type="button" variant="secondary" onClick={() => setPerson({ ...EMPTY, board: deskKey })}>{t.common.cancel}</Button> : null}
        </div>
        <ul className="divide-y divide-border">
          {people.length ? people.map((item) => (
            <li key={text(item._id)} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span>{text(item.name)}</span>
              <span className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPerson({
                    id: text(item._id),
                    board: deskKey,
                    name: text(item.name),
                    designation: text(item.designation),
                    phone: text(item.phone),
                    bioBn: text(item.bioBn),
                    bioEn: text(item.bioEn),
                    photoUrl: text(item.photoUrl),
                  })}
                >
                  {t.common.edit}
                </Button>
                <Button type="button" variant="secondary" onClick={() => onDelete(text(item._id))}>{t.common.delete}</Button>
              </span>
            </li>
          )) : <li className="py-2 text-sm text-muted-foreground">{t.website.empty}</li>}
        </ul>
      </SectionFrame>
    </div>
  );
}
