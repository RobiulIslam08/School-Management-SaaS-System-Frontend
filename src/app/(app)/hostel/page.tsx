"use client";

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Field, Input, Select } from "@/components/ui";
import { useDeleteHostelMutation, useUpdateHostelMutation } from "@/lib/api/operationsApi";
import { useCreateHostelMutation, useGetHostelsQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type HostelRow = { _id: string; name: string; type: string; capacity: number; occupied: number; warden?: string };

const emptyForm = { name: "", type: "boys", capacity: 40 as string | number, occupied: "" as string | number, warden: "" };

export default function HostelPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetHostelsQuery();
  const [createHostel] = useCreateHostelMutation();
  const [updateHostel] = useUpdateHostelMutation();
  const [deleteHostel] = useDeleteHostelMutation();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<HostelRow | null>(null);
  const [remove, setRemove] = useState<HostelRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const rows = (data?.data ?? []) as HostelRow[];
  const beds = useMemo(
    () => ({
      capacity: rows.reduce((sum, row) => sum + (row.capacity ?? 0), 0),
      occupied: rows.reduce((sum, row) => sum + (row.occupied ?? 0), 0),
    }),
    [rows]
  );

  function payload() {
    return {
      name: form.name,
      type: form.type,
      capacity: Number(form.capacity) || 0,
      occupied: Number(form.occupied) || 0,
      warden: form.warden,
    };
  }

  return (
    <div>
      <PageHeader
        title={t.hostel.title}
        subtitle={t.hostel.subtitle}
        action={<Button onClick={() => { setForm(emptyForm); setEdit(null); setOpen(true); }}>{t.common.add}</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.hostel.title} value={rows.length} icon={<Building2 size={18} />} />
        <StatCard label={t.hostel.capacity} value={beds.capacity} />
        <StatCard label={t.hostel.occupied} value={beds.occupied} tone={beds.occupied > beds.capacity ? "danger" : "neutral"} />
      </div>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.hostel.empty} hint={t.hostel.emptyHint} /> : null}
      <DataTable
        searchable
        pageSize={12}
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.common.name, cell: (row) => row.name, sortValue: (row) => row.name },
          { header: t.hostel.type, cell: (row) => (row.type === "girls" ? t.hostel.girls : t.hostel.boys) },
          { header: t.hostel.warden, cell: (row) => row.warden || "—" },
          {
            header: t.hostel.occupancy,
            cell: (row) => (
              <div>
                <p className="tabular-nums">
                  {row.occupied} / {row.capacity}
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${row.capacity ? Math.min(100, Math.round((row.occupied / row.capacity) * 100)) : 0}%` }}
                  />
                </div>
              </div>
            ),
            sortValue: (row) => row.occupied,
          },
        ]}
        actions={(row) => [
          {
            label: t.common.edit,
            onClick: () => {
              setEdit(row);
              setForm({
                name: row.name,
                type: row.type,
                capacity: row.capacity,
                occupied: row.occupied,
                warden: row.warden ?? "",
              });
              setOpen(true);
            },
          },
          { label: t.common.delete, onClick: () => setRemove(row) },
        ]}
      />
      <Dialog open={open} title={edit ? t.common.edit : t.common.add} onClose={() => { setOpen(false); setEdit(null); }}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = edit ? await updateHostel({ id: edit._id, ...payload() }) : await createHostel(payload());
            if (toastApiResult(result, t.common.save, t.common.loadError)) {
              setOpen(false);
              setEdit(null);
            }
          }}
        >
          <Field label={t.common.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label={t.hostel.type}>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="boys">{t.hostel.boys}</option>
              <option value="girls">{t.hostel.girls}</option>
            </Select>
          </Field>
          <Field label={t.hostel.capacity}><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value === "" ? "" : Number(e.target.value) })} /></Field>
          <Field label={t.hostel.occupied}><Input type="number" value={form.occupied} onChange={(e) => setForm({ ...form, occupied: e.target.value === "" ? "" : Number(e.target.value) })} /></Field>
          <Field label={t.hostel.warden}><Input value={form.warden} onChange={(e) => setForm({ ...form, warden: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setOpen(false); setEdit(null); }}>{t.common.cancel}</Button>
            <Button type="submit">{t.common.save}</Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={Boolean(remove)}
        title={t.hostel.deleteAsk}
        message={remove?.name ?? ""}
        danger
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          if (!remove) return;
          const result = await deleteHostel(remove._id);
          if (toastApiResult(result, t.common.delete, t.common.loadError)) setRemove(null);
        }}
      />
    </div>
  );
}
