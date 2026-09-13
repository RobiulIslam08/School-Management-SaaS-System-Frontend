"use client";

import { useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable, FormPanel } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select } from "@/components/ui";
import { useCreatePayrollMutation, useGetPayrollQuery, useGetTeachersQuery, usePayPayrollMutation } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type Row = { _id: string; month: string; net: number; status: string; teacherId?: { name?: string } };

export default function PayrollPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetPayrollQuery();
  const { data: teachers } = useGetTeachersQuery();
  const [createPayroll] = useCreatePayrollMutation();
  const [pay] = usePayPayrollMutation();
  const [form, setForm] = useState({ teacherId: "", month: "2026-09" });
  const rows = (data?.data ?? []) as Row[];
  const teacherList = (teachers?.data ?? []) as Array<{ _id: string; name: string }>;

  return (
    <div>
      <PageHeader title={t.payroll.title} subtitle={t.payroll.subtitle} />
      <FormPanel className="md:grid-cols-3" onSubmit={async (e) => {
        e.preventDefault();
        toastApiResult(await createPayroll(form), t.payroll.create, t.common.loadError);
      }}>
        <Field label={t.common.teacher}>
          <Select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
            <option value="">{t.common.teacher}</option>
            {teacherList.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
        </Field>
        <Field label={t.payroll.month}><Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></Field>
        <Button type="submit">{t.payroll.create}</Button>
      </FormPanel>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.payroll.empty} /> : null}
      <DataTable
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.common.teacher, cell: (row) => row.teacherId?.name ?? "—" },
          { header: t.payroll.month, cell: (row) => row.month },
          { header: t.payroll.net, cell: (row) => row.net, align: "right" },
          { header: t.common.status, cell: (row) => row.status },
          {
            header: t.common.actions,
            cell: (row) =>
              row.status !== "paid" ? (
                <Button variant="secondary" onClick={async () => toastApiResult(await pay(row._id), t.payroll.markPaid, t.common.loadError)}>
                  {t.payroll.markPaid}
                </Button>
              ) : (
                t.fees.paid
              ),
          },
        ]}
      />
    </div>
  );
}
