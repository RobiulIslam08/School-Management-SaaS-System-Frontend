"use client";

import { useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable, FormPanel } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { useAddPaymentMutation, useCreateLedgerMutation, useGetFeeSummaryQuery, useGetLedgersQuery, useGetStudentsQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

const METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank Transfer", "Cheque", "Other"];

export default function FeesPage() {
  const { t } = useI18n();
  const { data: summary } = useGetFeeSummaryQuery();
  const { data, isLoading, isError, refetch } = useGetLedgersQuery();
  const { data: students } = useGetStudentsQuery();
  const [createLedger] = useCreateLedgerMutation();
  const [addPayment] = useAddPaymentMutation();
  const [form, setForm] = useState({ studentId: "", title: "Tuition", dueAmount: 0, academicYear: "2026" });
  const [pay, setPay] = useState({ id: "", amount: 0, method: "Cash", refNo: "" });
  const rows = (data?.data ?? []) as Array<{ _id: string; title: string; dueAmount: number; paidAmount: number; status: string; studentId?: { name?: string } }>;
  const studentList = (students?.data ?? []) as Array<{ _id: string; name: string }>;

  return (
    <div>
      <PageHeader title={t.fees.title} subtitle={t.fees.subtitle} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card><p className="text-sm text-muted-foreground">{t.fees.due}</p><p className="text-2xl font-semibold tabular-nums">৳ {summary?.data.due ?? 0}</p></Card>
        <Card><p className="text-sm text-muted-foreground">{t.fees.collected}</p><p className="text-2xl font-semibold tabular-nums">৳ {summary?.data.collected ?? 0}</p></Card>
        <Card>
          <p className="text-sm text-muted-foreground">{t.fees.methods}</p>
          <p className="mt-2 text-sm">{Object.entries(summary?.data.byMethod ?? {}).map(([k, v]) => `${k}: ${v}`).join(" · ") || "—"}</p>
        </Card>
      </div>
      {(summary?.data.byClass ?? []).length ? (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">{t.fees.byClass}</h2>
          <DataTable
            rows={summary?.data.byClass ?? []}
            rowKey={(row) => row.classId}
            columns={[
              { header: t.common.class, cell: (row) => row.name, sortValue: (row) => row.name },
              { header: t.reports.count, cell: (row) => row.studentCount, align: "right", sortValue: (row) => row.studentCount },
              { header: t.fees.classDue, cell: (row) => `৳ ${row.due}`, align: "right", sortValue: (row) => row.due },
              { header: t.fees.classPaid, cell: (row) => `৳ ${row.collected}`, align: "right", sortValue: (row) => row.collected },
            ]}
          />
        </div>
      ) : null}
      <FormPanel className="md:grid-cols-4" onSubmit={async (e) => {
        e.preventDefault();
        toastApiResult(await createLedger(form), t.fees.addDue, t.common.loadError);
      }}>
        <Field label={t.common.student}>
          <Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
            <option value="">{t.common.student}</option>
            {studentList.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
        </Field>
        <Field label={t.fees.titleField}><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label={t.fees.due}><Input type="number" value={form.dueAmount} onChange={(e) => setForm({ ...form, dueAmount: Number(e.target.value) })} /></Field>
        <Button type="submit">{t.fees.addDue}</Button>
      </FormPanel>
      <FormPanel className="md:grid-cols-5" onSubmit={async (e) => {
        e.preventDefault();
        toastApiResult(await addPayment(pay), t.fees.recordPay, t.common.loadError);
      }}>
        <Field label={t.fees.ledger}>
          <Select value={pay.id} onChange={(e) => setPay({ ...pay, id: e.target.value })}>
            <option value="">{t.fees.ledger}</option>
            {rows.map((row) => <option key={row._id} value={row._id}>{row.studentId?.name} · {row.title}</option>)}
          </Select>
        </Field>
        <Field label={t.common.amount}><Input type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} /></Field>
        <Field label={t.fees.methods}>
          <Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
            {METHODS.map((method) => <option key={method}>{method}</option>)}
          </Select>
        </Field>
        <Field label={t.fees.ref}><Input value={pay.refNo} onChange={(e) => setPay({ ...pay, refNo: e.target.value })} /></Field>
        <Button type="submit">{t.fees.recordPay}</Button>
      </FormPanel>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      <DataTable
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.common.student, cell: (row) => row.studentId?.name ?? "—" },
          { header: t.fees.titleField, cell: (row) => row.title },
          { header: t.fees.due, cell: (row) => row.dueAmount, align: "right" },
          { header: t.fees.paid, cell: (row) => row.paidAmount, align: "right" },
          { header: t.common.status, cell: (row) => row.status },
        ]}
      />
    </div>
  );
}
