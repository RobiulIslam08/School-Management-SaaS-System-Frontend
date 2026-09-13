"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Wallet } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog, Dialog, Sheet } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, Field, Input } from "@/components/ui";
import { useUpdateTeacherMutation } from "@/lib/api/peopleApi";
import { useCreateTeacherMutation, useGetTeachersQuery } from "@/lib/api/schoolApi";
import { activeTone } from "@/lib/status";
import { useI18n } from "@/lib/i18n";

type TeacherRow = {
  _id: string;
  name: string;
  staffId: string;
  phone?: string;
  email?: string;
  designation?: string;
  isActive?: boolean;
  salaryStructure?: { basic?: number; house?: number; medical?: number; other?: number };
  subjects?: Array<{ name?: string }>;
};

const emptyForm = { name: "", phone: "", email: "", designation: "Teacher", basic: 0, house: 0, medical: 0, other: 0 };

export default function TeachersPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetTeachersQuery();
  const [createTeacher] = useCreateTeacherMutation();
  const [updateTeacher, { isLoading: saving }] = useUpdateTeacherMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<TeacherRow | null>(null);
  const [confirm, setConfirm] = useState<TeacherRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const rows = (data?.data ?? []) as TeacherRow[];
  const active = rows.filter((row) => row.isActive !== false).length;
  const payroll = useMemo(
    () => rows.reduce((sum, row) => sum + (row.salaryStructure?.basic ?? 0), 0),
    [rows]
  );

  function salaryPayload() {
    return {
      name: form.name,
      phone: form.phone,
      email: form.email,
      designation: form.designation,
      salaryStructure: { basic: Number(form.basic), house: Number(form.house), medical: Number(form.medical), other: Number(form.other) },
    };
  }

  return (
    <div>
      <PageHeader
        title={t.teachers.title}
        subtitle={t.teachers.subtitle}
        action={<Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}>{t.teachers.add}</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.teachers.title} value={rows.length} icon={<GraduationCap size={18} />} />
        <StatCard label={t.common.active} value={active} tone="success" />
        <StatCard label={t.teachers.basic} value={payroll} icon={<Wallet size={18} />} />
      </div>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.teachers.empty} hint={t.teachers.emptyHint} /> : null}
      <DataTable
        searchable
        pageSize={12}
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.teachers.staffId, cell: (row) => row.staffId, sortValue: (row) => row.staffId },
          { header: t.common.name, cell: (row) => row.name, sortValue: (row) => row.name },
          { header: t.teachers.designation, cell: (row) => row.designation || "—" },
          { header: t.common.phone, cell: (row) => row.phone || "—" },
          {
            header: t.common.status,
            cell: (row) => (
              <StatusBadge
                label={row.isActive === false ? t.common.inactive : t.common.active}
                tone={activeTone(row.isActive)}
              />
            ),
          },
        ]}
        actions={(row) => [
          {
            label: t.common.edit,
            onClick: () => {
              setEdit(row);
              setForm({
                name: row.name,
                phone: row.phone ?? "",
                email: row.email ?? "",
                designation: row.designation ?? "Teacher",
                basic: row.salaryStructure?.basic ?? 0,
                house: row.salaryStructure?.house ?? 0,
                medical: row.salaryStructure?.medical ?? 0,
                other: row.salaryStructure?.other ?? 0,
              });
            },
          },
          {
            label: row.isActive === false ? t.common.activate : t.common.deactivate,
            onClick: () => setConfirm(row),
          },
        ]}
      />
      <Dialog open={createOpen} title={t.teachers.add} onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await createTeacher(salaryPayload());
            if (toastApiResult(result, t.common.add, t.common.loadError)) {
              setCreateOpen(false);
              setForm(emptyForm);
            }
          }}
        >
          <Field label={t.common.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label={t.common.phone}><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label={t.common.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label={t.teachers.designation}><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Field>
          <Field label={t.teachers.basic}><Input type="number" value={form.basic} onChange={(e) => setForm({ ...form, basic: Number(e.target.value) })} /></Field>
          <Field label={t.teachers.house}><Input type="number" value={form.house} onChange={(e) => setForm({ ...form, house: Number(e.target.value) })} /></Field>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>{t.common.cancel}</Button>
            <Button type="submit">{t.common.add}</Button>
          </div>
        </form>
      </Dialog>
      <Sheet open={Boolean(edit)} title={t.common.edit} onClose={() => setEdit(null)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!edit) return;
            const result = await updateTeacher({ id: edit._id, ...salaryPayload() });
            if (toastApiResult(result, t.common.save, t.common.loadError)) setEdit(null);
          }}
        >
          <Field label={t.common.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={t.common.phone}><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label={t.teachers.designation}><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Field>
          <Field label={t.teachers.basic}><Input type="number" value={form.basic} onChange={(e) => setForm({ ...form, basic: Number(e.target.value) })} /></Field>
          <Field label={t.teachers.house}><Input type="number" value={form.house} onChange={(e) => setForm({ ...form, house: Number(e.target.value) })} /></Field>
          <Field label={t.teachers.medical}><Input type="number" value={form.medical} onChange={(e) => setForm({ ...form, medical: Number(e.target.value) })} /></Field>
          <Field label={t.teachers.other}><Input type="number" value={form.other} onChange={(e) => setForm({ ...form, other: Number(e.target.value) })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEdit(null)}>{t.common.cancel}</Button>
            <Button disabled={saving} type="submit">{t.common.save}</Button>
          </div>
        </form>
      </Sheet>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={t.teachers.deactivateAsk}
        message={confirm?.name ?? ""}
        confirmLabel={confirm?.isActive === false ? t.common.activate : t.common.deactivate}
        danger={confirm?.isActive !== false}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const result = await updateTeacher({ id: confirm._id, isActive: confirm.isActive === false });
          if (toastApiResult(result, t.common.save, t.common.loadError)) setConfirm(null);
        }}
      />
    </div>
  );
}
