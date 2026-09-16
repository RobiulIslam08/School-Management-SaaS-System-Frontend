"use client";

import { useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable, FormPanel } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { useAddPaymentMutation, useGetFeeSummaryQuery, useGetLedgersQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

const METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank Transfer", "Cheque", "Other"];

type LedgerRow = {
  _id: string;
  title: string;
  dueAmount: number;
  paidAmount: number;
  discount?: number;
  status: string;
  studentId?: { name?: string };
};

function remaining(row: LedgerRow): number {
  return Math.max(row.dueAmount - (row.discount ?? 0) - row.paidAmount, 0);
}

export default function FeeCollectedPage() {
  const { t } = useI18n();
  const { data: summary } = useGetFeeSummaryQuery();
  const { data, isLoading, isError, refetch } = useGetLedgersQuery();
  const [addPayment] = useAddPaymentMutation();
  const [pay, setPay] = useState({ id: "", amount: 0, method: "Cash", refNo: "" });
  const allRows = (data?.data ?? []) as LedgerRow[];
  const openLedgers = allRows.filter((row) => remaining(row) > 0);
  const collectedRows = allRows.filter((row) => row.paidAmount > 0);

  return (
    <div>
      <PageHeader title={t.fees.collectedTitle} subtitle={t.fees.collectedSubtitle} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted-foreground">{t.fees.collected}</p>
          <p className="text-2xl font-semibold tabular-nums">৳ {summary?.data.collected ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">{t.fees.methods}</p>
          <p className="mt-2 text-sm">
            {Object.entries(summary?.data.byMethod ?? {})
              .map(([key, value]) => `${key}: ${value}`)
              .join(" · ") || "—"}
          </p>
        </Card>
      </div>
      <FormPanel
        className="md:grid-cols-5"
        onSubmit={async (e) => {
          e.preventDefault();
          toastApiResult(await addPayment(pay), t.fees.recordPay, t.common.loadError);
        }}
      >
        <Field label={t.fees.ledger}>
          <Select value={pay.id} onChange={(e) => setPay({ ...pay, id: e.target.value })}>
            <option value="">{t.fees.ledger}</option>
            {openLedgers.map((row) => (
              <option key={row._id} value={row._id}>
                {row.studentId?.name} · {row.title} (৳ {remaining(row)})
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.common.amount}>
          <Input type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} />
        </Field>
        <Field label={t.fees.methods}>
          <Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
            {METHODS.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </Select>
        </Field>
        <Field label={t.fees.ref}>
          <Input value={pay.refNo} onChange={(e) => setPay({ ...pay, refNo: e.target.value })} />
        </Field>
        <Button type="submit">{t.fees.recordPay}</Button>
      </FormPanel>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !collectedRows.length ? <EmptyState title={t.fees.emptyCollected} /> : null}
      <DataTable
        rows={collectedRows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.common.student, cell: (row) => row.studentId?.name ?? "—" },
          { header: t.fees.titleField, cell: (row) => row.title },
          { header: t.fees.paid, cell: (row) => row.paidAmount, align: "right" },
          { header: t.common.status, cell: (row) => row.status },
        ]}
      />
    </div>
  );
}
