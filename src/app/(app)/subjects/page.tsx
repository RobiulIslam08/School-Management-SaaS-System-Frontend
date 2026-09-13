"use client";

import { useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable, FormPanel } from "@/components/data-table";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select } from "@/components/ui";
import { useCreateSubjectMutation, useGetClassesQuery, useGetSubjectsQuery, useGetTeachersQuery } from "@/lib/api/schoolApi";
import { useAssignSubjectTeacherMutation, useDeleteSubjectMutation, useReorderSubjectsMutation, useUpdateSubjectMutation } from "@/lib/api/subjectApi";
import { useI18n } from "@/lib/i18n";

type SubjectRow = {
  _id: string;
  name: string;
  code: string;
  classId?: { _id?: string; name?: string } | string;
  group?: string;
  compulsory?: boolean;
  sortOrder?: number;
  teacherId?: { _id?: string; name?: string } | string;
  markDistribution?: { cq: number; mcq: number; practical: number; attendance: number };
};

export default function SubjectsPage() {
  const { t } = useI18n();
  const [classId, setClassId] = useState("");
  const { data, isLoading, isError, refetch } = useGetSubjectsQuery(classId || undefined);
  const { data: classes } = useGetClassesQuery();
  const { data: teachers } = useGetTeachersQuery();
  const [createSubject] = useCreateSubjectMutation();
  const [updateSubject] = useUpdateSubjectMutation();
  const [deleteSubject] = useDeleteSubjectMutation();
  const [reorder] = useReorderSubjectsMutation();
  const [assignTeacher] = useAssignSubjectTeacherMutation();
  const [form, setForm] = useState({ name: "", code: "", cq: 60, mcq: 40, practical: 0, attendance: 0, group: "Common", compulsory: true });
  const [edit, setEdit] = useState<SubjectRow | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const rows = ((data?.data ?? []) as SubjectRow[]).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string }>;
  const teacherList = (teachers?.data ?? []) as Array<{ _id: string; name: string }>;

  async function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= rows.length || !classId) return;
    const ordered = rows.map((row) => row._id);
    const [item] = ordered.splice(index, 1);
    ordered.splice(next, 0, item);
    toastApiResult(await reorder({ classId, orderedIds: ordered }), t.common.save);
  }

  return (
    <div>
      <PageHeader title={t.subjects.title} subtitle={t.subjects.subtitle} />
      <div className="mb-4 max-w-sm">
        <Field label={t.common.class}>
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">{t.subjects.allClasses}</option>
            {classList.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <FormPanel
        className="lg:grid-cols-8"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!classId) return;
          const result = await createSubject({
            name: form.name,
            code: form.code,
            classId,
            group: form.group,
            compulsory: form.compulsory,
            markDistribution: { cq: form.cq, mcq: form.mcq, practical: form.practical, attendance: form.attendance },
          });
          if (toastApiResult(result, t.common.add, t.common.loadError)) {
            setForm({ ...form, name: "", code: "" });
          }
        }}
      >
        <Field label={t.common.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label={t.common.code}><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
        <Field label={t.subjects.group}>
          <Select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
            <option value="Common">Common</option>
            <option value="Science">Science</option>
            <option value="Business">Business</option>
            <option value="Humanities">Humanities</option>
          </Select>
        </Field>
        <Field label="CQ"><Input type="number" value={form.cq} onChange={(e) => setForm({ ...form, cq: Number(e.target.value) })} /></Field>
        <Field label="MCQ"><Input type="number" value={form.mcq} onChange={(e) => setForm({ ...form, mcq: Number(e.target.value) })} /></Field>
        <Field label={t.results.practical}><Input type="number" value={form.practical} onChange={(e) => setForm({ ...form, practical: Number(e.target.value) })} /></Field>
        <Field label={t.common.compulsory}>
          <Select value={form.compulsory ? "yes" : "no"} onChange={(e) => setForm({ ...form, compulsory: e.target.value === "yes" })}>
            <option value="yes">{t.common.compulsory}</option>
            <option value="no">{t.common.optional}</option>
          </Select>
        </Field>
        <Button type="submit" disabled={!classId}>{t.common.add}</Button>
      </FormPanel>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.subjects.empty} hint={t.subjects.emptyHint} /> : null}
      <DataTable
        searchable
        pageSize={15}
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.common.name, cell: (row) => row.name, sortValue: (row) => row.name },
          { header: t.common.class, cell: (row) => typeof row.classId === "object" ? row.classId?.name : "—" },
          { header: t.subjects.group, cell: (row) => row.group ?? "Common" },
          { header: t.subjects.distribution, cell: (row) => `${row.markDistribution?.cq ?? 0}/${row.markDistribution?.mcq ?? 0}/${row.markDistribution?.practical ?? 0}` },
          { header: t.subjects.assignTeacher, cell: (row) => typeof row.teacherId === "object" ? row.teacherId?.name : "—" },
        ]}
        actions={(row) => {
          const i = rows.findIndex((item) => item._id === row._id);
          return [
            { label: t.common.edit, onClick: () => setEdit(row) },
            { label: t.subjects.moveUp, onClick: () => move(i, -1) },
            { label: t.subjects.moveDown, onClick: () => move(i, 1) },
            { label: t.common.delete, danger: true, onClick: () => setRemoveId(row._id) },
          ];
        }}
      />
      <Dialog open={Boolean(edit)} title={t.common.edit} onClose={() => setEdit(null)}>
        {edit ? (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await updateSubject({
                id: edit._id,
                name: edit.name,
                group: edit.group,
                compulsory: edit.compulsory,
                markDistribution: edit.markDistribution,
              });
              if (edit.teacherId) {
                await assignTeacher({ id: edit._id, teacherId: typeof edit.teacherId === "string" ? edit.teacherId : edit.teacherId._id });
              }
              toastApiResult(result, t.common.save);
              setEdit(null);
            }}
          >
            <Field label={t.common.name}><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label={t.subjects.assignTeacher}>
              <Select
                value={typeof edit.teacherId === "object" ? edit.teacherId?._id ?? "" : edit.teacherId ?? ""}
                onChange={(e) => setEdit({ ...edit, teacherId: e.target.value })}
              >
                <option value="">{t.common.teacher}</option>
                {teacherList.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit">{t.common.save}</Button>
          </form>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={Boolean(removeId)}
        title={t.common.delete}
        message={t.subjects.emptyHint}
        danger
        onClose={() => setRemoveId(null)}
        onConfirm={async () => {
          if (!removeId) return;
          toastApiResult(await deleteSubject(removeId), t.common.delete);
          setRemoveId(null);
        }}
      />
    </div>
  );
}
