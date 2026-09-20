"use client";

import { useMemo, useState } from "react";
import { Bus } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Field, Input } from "@/components/ui";
import { useDeleteRouteMutation, useUpdateRouteMutation } from "@/lib/api/operationsApi";
import { useCreateRouteMutation, useGetTransportQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type RouteRow = {
  _id: string;
  name: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNo?: string;
  fee?: number;
  stops?: string[];
};

const emptyForm = { name: "", driverName: "", driverPhone: "", vehicleNo: "", fee: "" as string | number, stops: "" };

export default function TransportPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetTransportQuery();
  const [createRoute] = useCreateRouteMutation();
  const [updateRoute] = useUpdateRouteMutation();
  const [deleteRoute] = useDeleteRouteMutation();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<RouteRow | null>(null);
  const [remove, setRemove] = useState<RouteRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const rows = (data?.data ?? []) as RouteRow[];
  const totalFee = useMemo(() => rows.reduce((sum, row) => sum + (row.fee ?? 0), 0), [rows]);

  function payload() {
    return {
      name: form.name,
      driverName: form.driverName,
      driverPhone: form.driverPhone,
      vehicleNo: form.vehicleNo,
      fee: Number(form.fee) || 0,
      stops: form.stops.split(",").map((item) => item.trim()).filter(Boolean),
    };
  }

  return (
    <div>
      <PageHeader
        title={t.transport.title}
        subtitle={t.transport.subtitle}
        action={<Button onClick={() => { setForm(emptyForm); setEdit(null); setOpen(true); }}>{t.common.add}</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label={t.transport.route} value={rows.length} icon={<Bus size={18} />} />
        <StatCard label={t.transport.fee} value={totalFee} />
      </div>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.transport.empty} hint={t.transport.emptyHint} /> : null}
      <DataTable
        searchable
        pageSize={12}
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.transport.route, cell: (row) => row.name, sortValue: (row) => row.name },
          { header: t.transport.driver, cell: (row) => row.driverName || "—" },
          { header: t.transport.vehicle, cell: (row) => row.vehicleNo || "—" },
          { header: t.transport.stops, cell: (row) => (row.stops ?? []).join(", ") || "—" },
          { header: t.transport.fee, cell: (row) => row.fee ?? 0, align: "right", sortValue: (row) => row.fee ?? 0 },
        ]}
        actions={(row) => [
          {
            label: t.common.edit,
            onClick: () => {
              setEdit(row);
              setForm({
                name: row.name,
                driverName: row.driverName ?? "",
                driverPhone: row.driverPhone ?? "",
                vehicleNo: row.vehicleNo ?? "",
                fee: row.fee ?? "",
                stops: (row.stops ?? []).join(", "),
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
            const result = edit ? await updateRoute({ id: edit._id, ...payload() }) : await createRoute(payload());
            if (toastApiResult(result, t.common.save, t.common.loadError)) {
              setOpen(false);
              setEdit(null);
            }
          }}
        >
          <Field label={t.transport.route}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label={t.transport.driver}><Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} /></Field>
          <Field label={t.transport.driverPhone}><Input value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} /></Field>
          <Field label={t.transport.vehicle}><Input value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} /></Field>
          <Field label={t.transport.stops}><Input value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} /></Field>
          <Field label={t.transport.fee}><Input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value === "" ? "" : Number(e.target.value) })} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setOpen(false); setEdit(null); }}>{t.common.cancel}</Button>
            <Button type="submit">{t.common.save}</Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={Boolean(remove)}
        title={t.transport.deleteAsk}
        message={remove?.name ?? ""}
        danger
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          if (!remove) return;
          const result = await deleteRoute(remove._id);
          if (toastApiResult(result, t.common.delete, t.common.loadError)) setRemove(null);
        }}
      />
    </div>
  );
}
