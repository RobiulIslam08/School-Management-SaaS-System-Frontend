"use client";

import { useState } from "react";
import { Shield, Users } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog, Dialog, Sheet } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, Field, Input, Select } from "@/components/ui";
import { useUpdateUserMutation } from "@/lib/api/peopleApi";
import { useCreateUserMutation, useGetUsersQuery, useMeQuery } from "@/lib/api/schoolApi";
import { activeTone } from "@/lib/status";
import { useI18n } from "@/lib/i18n";

type UserRow = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive?: boolean;
};

const emptyForm = { name: "", email: "", password: "", phone: "", role: "teacher" };

export default function StaffPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const { data, isLoading, isError, refetch } = useGetUsersQuery();
  const meId = session?.data.user.id;
  const [createUser] = useCreateUserMutation();
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<UserRow | null>(null);
  const [confirm, setConfirm] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const rows = (data?.data ?? []) as UserRow[];

  function roleLabel(role: string) {
    if (role === "school_admin") return t.staff.admin;
    if (role === "accountant") return t.staff.accountant;
    if (role === "guardian") return t.staff.guardian;
    return t.staff.teacher;
  }

  return (
    <div>
      <PageHeader
        title={t.staff.title}
        subtitle={t.staff.subtitle}
        action={<Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}>{t.staff.add}</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.staff.title} value={rows.length} icon={<Users size={18} />} />
        <StatCard label={t.staff.admin} value={rows.filter((row) => row.role === "school_admin").length} icon={<Shield size={18} />} />
        <StatCard label={t.common.active} value={rows.filter((row) => row.isActive !== false).length} tone="success" />
      </div>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.staff.empty} hint={t.staff.emptyHint} /> : null}
      <DataTable
        searchable
        pageSize={12}
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.common.name, cell: (row) => row.name, sortValue: (row) => row.name },
          { header: t.common.email, cell: (row) => row.email, sortValue: (row) => row.email },
          { header: t.staff.role, cell: (row) => roleLabel(row.role), sortValue: (row) => row.role },
          {
            header: t.common.status,
            cell: (row) => (
              <StatusBadge label={row.isActive === false ? t.common.inactive : t.common.active} tone={activeTone(row.isActive)} />
            ),
          },
        ]}
        actions={(row) => [
          {
            label: t.common.edit,
            onClick: () => {
              setEdit(row);
              setForm({ name: row.name, email: row.email, password: "", phone: row.phone ?? "", role: row.role });
            },
          },
          ...(String(row._id) === meId
            ? []
            : [{ label: row.isActive === false ? t.common.activate : t.common.deactivate, onClick: () => setConfirm(row) }]),
        ]}
      />
      <Dialog open={createOpen} title={t.staff.add} onClose={() => setCreateOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await createUser(form);
            if (toastApiResult(result, t.common.add, t.common.loadError)) {
              setCreateOpen(false);
              setForm(emptyForm);
            }
          }}
        >
          <Field label={t.common.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label={t.common.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label={t.staff.password}><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
          <Field label={t.staff.role}>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="school_admin">{t.staff.admin}</option>
              <option value="teacher">{t.staff.teacher}</option>
              <option value="accountant">{t.staff.accountant}</option>
              <option value="guardian">{t.staff.guardian}</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
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
            const isSelf = String(edit._id) === meId;
            const result = await updateUser({
              id: edit._id,
              name: form.name,
              phone: form.phone,
              ...(isSelf ? {} : { role: form.role }),
              ...(form.password ? { password: form.password } : {}),
            });
            if (toastApiResult(result, t.common.save, t.common.loadError)) setEdit(null);
          }}
        >
          <Field label={t.common.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={t.common.phone}><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label={t.staff.role}>
            <Select
              value={form.role}
              disabled={String(edit?._id) === meId}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="school_admin">{t.staff.admin}</option>
              <option value="teacher">{t.staff.teacher}</option>
              <option value="accountant">{t.staff.accountant}</option>
              <option value="guardian">{t.staff.guardian}</option>
            </Select>
          </Field>
          {String(edit?._id) === meId ? <p className="text-xs text-muted-foreground">{t.staff.selfProtect}</p> : null}
          <Field label={t.common.newPassword}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t.common.optional} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEdit(null)}>{t.common.cancel}</Button>
            <Button disabled={saving} type="submit">{t.common.save}</Button>
          </div>
        </form>
      </Sheet>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={t.staff.deactivateAsk}
        message={confirm?.email ?? ""}
        confirmLabel={confirm?.isActive === false ? t.common.activate : t.common.deactivate}
        danger={confirm?.isActive !== false}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const result = await updateUser({ id: confirm._id, isActive: confirm.isActive === false });
          if (toastApiResult(result, t.common.save, t.common.loadError)) setConfirm(null);
        }}
      />
    </div>
  );
}
