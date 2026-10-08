"use client";

import { useMemo, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { RoutineGrid } from "@/components/routine-grid";
import { Button, Card, Field, Select, Textarea } from "@/components/ui";
import { useGetClassesQuery, useGetSubjectsQuery, useMeQuery } from "@/lib/api/schoolApi";
import { useGetSyllabusQuery, useSaveSyllabusMutation } from "@/lib/api/websiteApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";

type SubjectRow = { _id: string; name: string; nameBn?: string };
type OutlineRow = {
  subjectId?: { _id?: string } | string;
  academicYear?: string;
  chaptersBn?: string[];
  chaptersEn?: string[];
};

function subjectKey(value: OutlineRow["subjectId"]): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id ?? "");
}

export function AcademicBoard() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const { data: classes } = useGetClassesQuery();
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const [classId, setClassId] = useState("");
  const selected = classList.find((item) => item._id === classId) ?? classList[0];
  const activeId = selected?._id ?? "";
  const sections = sectionNames(selected?.sections as never);
  const year = session?.data.settings?.academicYear ?? "";
  const { data: subjects } = useGetSubjectsQuery(activeId, { skip: !activeId });
  const { data: outlines } = useGetSyllabusQuery(activeId, { skip: !activeId });
  const [saveSyllabus, { isLoading }] = useSaveSyllabusMutation();
  const subjectList = (subjects?.data ?? []) as SubjectRow[];
  const outlineList = (outlines?.data ?? []) as OutlineRow[];
  const bySubject = useMemo(() => {
    const map = new Map<string, OutlineRow>();
    for (const row of outlineList) {
      const key = subjectKey(row.subjectId);
      if (key && !map.has(key)) map.set(key, row);
    }
    return map;
  }, [outlineList]);
  const [drafts, setDrafts] = useState<Record<string, { bn: string; en: string }>>({});

  function draft(id: string) {
    if (drafts[id]) return drafts[id];
    const row = bySubject.get(id);
    return { bn: (row?.chaptersBn ?? []).join("\n"), en: (row?.chaptersEn ?? []).join("\n") };
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <Field label={t.common.class}>
          <Select value={activeId} onChange={(event) => { setClassId(event.target.value); setDrafts({}); }}>
            {classList.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </Select>
        </Field>
        <RoutineGrid classId={activeId} sections={sections} />
      </Card>
      <Card className="space-y-4">
        <p className="text-sm font-medium">{t.website.chapters}</p>
        {!subjectList.length ? <p className="text-sm text-muted-foreground">{t.website.empty}</p> : null}
        {subjectList.map((subject) => {
          const value = draft(subject._id);
          return (
            <form
              key={subject._id}
              className="space-y-2 rounded-xl border p-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await saveSyllabus({
                  classId: activeId,
                  subjectId: subject._id,
                  academicYear: year,
                  chaptersBn: value.bn.split("\n"),
                  chaptersEn: value.en.split("\n"),
                });
                toastApiResult(result, t.common.save, t.common.loadError);
              }}
            >
              <p className="text-sm font-semibold">{subject.nameBn || subject.name}</p>
              <div className="grid gap-2 md:grid-cols-2">
                <Field label="বাংলা">
                  <Textarea
                    rows={5}
                    value={value.bn}
                    onChange={(event) => setDrafts((current) => ({ ...current, [subject._id]: { ...value, bn: event.target.value } }))}
                  />
                </Field>
                <Field label="English">
                  <Textarea
                    rows={5}
                    value={value.en}
                    onChange={(event) => setDrafts((current) => ({ ...current, [subject._id]: { ...value, en: event.target.value } }))}
                  />
                </Field>
              </div>
              <Button type="submit" disabled={isLoading}>{t.common.save}</Button>
            </form>
          );
        })}
      </Card>
    </div>
  );
}
