"use client";

import { useEffect, useMemo, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { Field, Select } from "@/components/ui";
import { useGetSubjectsQuery, useGetTeachersQuery } from "@/lib/api/schoolApi";
import { useDeleteRoutineMutation, useGetRoutinesQuery, useSaveRoutineMutation } from "@/lib/api/routineApi";
import { useI18n } from "@/lib/i18n";

const DAYS = [
  { id: 0, bn: "রবি", en: "Sun" },
  { id: 1, bn: "সোম", en: "Mon" },
  { id: 2, bn: "মঙ্গল", en: "Tue" },
  { id: 3, bn: "বুধ", en: "Wed" },
  { id: 4, bn: "বৃহস্পতি", en: "Thu" },
];

const PERIODS = [1, 2, 3, 4, 5, 6];

function recordId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) return String((value as { _id?: unknown })._id ?? "");
  return "";
}

type SlotRow = {
  _id: string;
  day: number;
  period: number;
  subjectId?: unknown;
  teacherId?: unknown;
};

export function RoutineGrid({ classId, sections }: { classId: string; sections: string[] }) {
  const { t, locale } = useI18n();
  const [section, setSection] = useState(sections[0] ?? "A");
  const { data: routines } = useGetRoutinesQuery(classId ? { classId, section } : undefined, { skip: !classId });
  const { data: subjects } = useGetSubjectsQuery(classId, { skip: !classId });
  const { data: teachers } = useGetTeachersQuery();
  const [saveRoutine] = useSaveRoutineMutation();
  const [deleteRoutine] = useDeleteRoutineMutation();

  const sectionKey = sections.join("|");
  useEffect(() => {
    setSection(sectionKey.split("|").find(Boolean) ?? "A");
  }, [classId, sectionKey]);

  const subjectList = (subjects?.data ?? []) as Array<{ _id: string; name: string }>;
  const teacherList = (teachers?.data ?? []) as Array<{ _id: string; name: string }>;
  const slots = (routines?.data ?? []) as SlotRow[];
  const byCell = useMemo(() => {
    const map = new Map<string, SlotRow>();
    for (const slot of slots) map.set(`${slot.day}-${slot.period}`, slot);
    return map;
  }, [slots]);

  async function setCell(day: number, period: number, subjectId: string, teacherId: string) {
    const current = byCell.get(`${day}-${period}`);
    if (!subjectId) {
      if (current?._id) {
        const removed = await deleteRoutine(current._id);
        toastApiResult(removed, t.common.delete, t.common.loadError);
      }
      return;
    }
    const result = await saveRoutine({
      classId,
      section,
      day,
      period,
      subjectId,
      teacherId: teacherId || undefined,
    });
    toastApiResult(result, t.classes.routine, t.common.loadError);
  }

  if (!classId) return <p className="text-sm text-muted-foreground">{t.common.class}</p>;

  return (
    <div className="space-y-3">
      <Field label={t.common.section}>
        <Select value={section} onChange={(event) => setSection(event.target.value)}>
          {(sections.length ? sections : ["A"]).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </Select>
      </Field>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="border-b px-2 py-2 text-left">{t.website.period}</th>
              {DAYS.map((day) => (
                <th key={day.id} className="border-b px-2 py-2 text-left">{locale === "bn" ? day.bn : day.en}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                <td className="border-b px-2 py-2 font-medium">{period}</td>
                {DAYS.map((day) => {
                  const slot = byCell.get(`${day.id}-${period}`);
                  const subjectId = recordId(slot?.subjectId);
                  const teacherId = recordId(slot?.teacherId);
                  return (
                    <td key={day.id} className="border-b px-1 py-1 align-top">
                      <select
                        className="h-9 w-full rounded-md border border-border bg-white px-1 text-xs"
                        value={subjectId}
                        onChange={(event) => setCell(day.id, period, event.target.value, teacherId)}
                      >
                        <option value="">{t.nav.subjects}</option>
                        {subjectList.map((item) => (
                          <option key={item._id} value={item._id}>{item.name}</option>
                        ))}
                      </select>
                      <select
                        className="mt-1 h-9 w-full rounded-md border border-border bg-white px-1 text-xs"
                        value={teacherId}
                        onChange={(event) => setCell(day.id, period, subjectId, event.target.value)}
                        disabled={!subjectId}
                      >
                        <option value="">{t.common.teacher}</option>
                        {teacherList.map((item) => (
                          <option key={item._id} value={item._id}>{item.name}</option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
