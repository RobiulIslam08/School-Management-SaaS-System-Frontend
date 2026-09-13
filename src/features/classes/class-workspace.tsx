"use client";

import { useMemo, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { ConfirmDialog, Sheet } from "@/components/dialog";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { Button, Field, Input, Select } from "@/components/ui";
import { EmptyState } from "@/components/query-state";
import { useGetClassWorkspaceQuery, useSaveClassSectionMutation, useDeleteClassSectionMutation } from "@/lib/api/classApi";
import { useGetClassesQuery, useGetSubjectsQuery, useGetTeachersQuery, usePromoteStudentsMutation, useGetStudentsQuery } from "@/lib/api/schoolApi";
import { useGetRoutinesQuery, useSaveRoutineMutation, useDeleteRoutineMutation } from "@/lib/api/routineApi";
import { asSectionRows } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export function ClassWorkspace({
  classId,
  className,
  onClose,
}: {
  classId: string;
  className: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { data } = useGetClassWorkspaceQuery(classId);
  const { data: subjects } = useGetSubjectsQuery(classId);
  const { data: teachers } = useGetTeachersQuery();
  const { data: students } = useGetStudentsQuery({ classId });
  const { data: classes } = useGetClassesQuery();
  const [saveSection] = useSaveClassSectionMutation();
  const [deleteSection] = useDeleteClassSectionMutation();
  const [promote] = usePromoteStudentsMutation();
  const [saveRoutine] = useSaveRoutineMutation();
  const [deleteRoutine] = useDeleteRoutineMutation();
  const [tab, setTab] = useState("sections");
  const [sectionForm, setSectionForm] = useState({ name: "", capacity: 0, classTeacherId: "" });
  const [removeName, setRemoveName] = useState<string | null>(null);
  const [targetClassId, setTargetClassId] = useState("");
  const [targetSection, setTargetSection] = useState("A");
  const [slot, setSlot] = useState({ section: "A", day: 0, period: 1, subjectId: "", teacherId: "" });
  const { data: routines } = useGetRoutinesQuery({ classId, section: slot.section });

  const workspace = data?.data as { class?: { sections?: unknown }; counts?: { students?: number; subjects?: number } } | undefined;
  const sections = asSectionRows(workspace?.class?.sections as never);
  const subjectList = (subjects?.data ?? []) as Array<{ _id: string; name: string }>;
  const teacherList = (teachers?.data ?? []) as Array<{ _id: string; name: string }>;
  const studentList = (students?.data ?? []) as Array<{ _id: string }>;
  const routineList = (routines?.data ?? []) as Array<{ _id: string; day: number; period: number; subjectId?: { name?: string } }>;
  const dayLabel = useMemo(() => [t.common.date, "1", "2", "3", "4", "5", "6"], [t]);

  return (
    <Sheet open onClose={onClose} title={`${className} · ${t.classes.workspace}`}>
      <WorkspaceTabs
        tabs={[
          { id: "sections", label: t.classes.sections },
          { id: "subjects", label: t.classes.subjects },
          { id: "routine", label: t.classes.routine },
          { id: "promote", label: t.classes.promote },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "sections" ? (
        <div className="space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!sectionForm.name) return;
              const result = await saveSection({ id: classId, ...sectionForm, classTeacherId: sectionForm.classTeacherId || undefined });
              toastApiResult(result, t.classes.addSection, t.common.loadError);
              setSectionForm({ name: "", capacity: 0, classTeacherId: "" });
            }}
          >
            <Field label={t.classes.sections}>
              <Input value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} />
            </Field>
            <Field label={t.common.capacity}>
              <Input type="number" value={sectionForm.capacity} onChange={(e) => setSectionForm({ ...sectionForm, capacity: Number(e.target.value) })} />
            </Field>
            <Field label={t.classes.classTeacher}>
              <Select value={sectionForm.classTeacherId} onChange={(e) => setSectionForm({ ...sectionForm, classTeacherId: e.target.value })}>
                <option value="">{t.common.teacher}</option>
                {teacherList.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit">{t.classes.addSection}</Button>
          </form>
          {sections.map((row) => (
            <div key={row.name} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <p className="text-sm font-medium">
                {row.name} · {t.common.capacity} {row.capacity}
              </p>
              <Button type="button" variant="danger" className="h-9" onClick={() => setRemoveName(row.name)}>
                {t.common.delete}
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "subjects" ? (
        <div className="space-y-2">
          {!subjectList.length ? <EmptyState title={t.subjects.empty} hint={t.subjects.emptyHint} /> : null}
          {subjectList.map((item) => (
            <p key={item._id} className="rounded-xl border px-4 py-3 text-sm">{item.name}</p>
          ))}
        </div>
      ) : null}

      {tab === "routine" ? (
        <div className="space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await saveRoutine({ classId, ...slot, subjectId: slot.subjectId || undefined, teacherId: slot.teacherId || undefined });
              toastApiResult(result, t.classes.routine, t.common.loadError);
            }}
          >
            <Field label={t.common.section}>
              <Select value={slot.section} onChange={(e) => setSlot({ ...slot, section: e.target.value })}>
                {sections.map((row) => (
                  <option key={row.name} value={row.name}>{row.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Day">
              <Select value={String(slot.day)} onChange={(e) => setSlot({ ...slot, day: Number(e.target.value) })}>
                {DAYS.map((day) => (
                  <option key={day} value={day}>{dayLabel[day] ?? day}</option>
                ))}
              </Select>
            </Field>
            <Field label="P">
              <Input type="number" min={1} value={slot.period} onChange={(e) => setSlot({ ...slot, period: Number(e.target.value) })} />
            </Field>
            <Field label={t.nav.subjects}>
              <Select value={slot.subjectId} onChange={(e) => setSlot({ ...slot, subjectId: e.target.value })}>
                <option value="">{t.nav.subjects}</option>
                {subjectList.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit">{t.common.save}</Button>
          </form>
          {!routineList.length ? <EmptyState title={t.classes.routine} /> : null}
          {routineList.map((row) => (
            <div key={row._id} className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm">
              <span>D{row.day} P{row.period} · {row.subjectId?.name ?? "—"}</span>
              <Button type="button" variant="ghost" onClick={async () => toastApiResult(await deleteRoutine(row._id), t.common.delete)}>
                {t.common.delete}
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "promote" ? (
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const ids = studentList.map((item) => item._id);
            if (!ids.length || !targetClassId) return;
            const result = await promote({ ids, targetClassId, targetSection });
            toastApiResult(result, t.classes.promote, t.common.loadError);
          }}
        >
          <p className="text-sm text-muted-foreground">{workspace?.counts?.students ?? 0} {t.classes.students}</p>
          <Field label={t.students.promoteClass}>
            <Select value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)}>
              <option value="">{t.students.promoteClass}</option>
              {((classes?.data ?? []) as Array<{ _id: string; name: string }>).map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.common.section}>
            <Input value={targetSection} onChange={(e) => setTargetSection(e.target.value)} />
          </Field>
          <Button type="submit">{t.classes.promote}</Button>
        </form>
      ) : null}

      <ConfirmDialog
        open={Boolean(removeName)}
        title={t.common.delete}
        message={t.classes.deleteAsk}
        danger
        onClose={() => setRemoveName(null)}
        onConfirm={async () => {
          if (!removeName) return;
          const result = await deleteSection({ id: classId, name: removeName });
          toastApiResult(result, t.common.delete, t.classes.deleteWarn);
          setRemoveName(null);
        }}
      />
    </Sheet>
  );
}
