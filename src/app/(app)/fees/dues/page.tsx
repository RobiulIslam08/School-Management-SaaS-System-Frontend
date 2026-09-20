"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable, FormPanel } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { useCreateLedgerMutation, useGetFeeSummaryQuery, useGetLedgersQuery, useGetStudentsQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { parseNumberOrZero } from "@/lib/number-input";

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

function DuesInner() {
  const { t } = useI18n();
  const search = useSearchParams();
  const presetStudent = search.get("studentId") ?? "";
  const { data: summary } = useGetFeeSummaryQuery();
  const { data, isLoading, isError, refetch } = useGetLedgersQuery(presetStudent ? { studentId: presetStudent } : undefined);
  const { data: students } = useGetStudentsQuery();
  const [createLedger] = useCreateLedgerMutation();
  const [form, setForm] = useState({ studentId: presetStudent, title: "Tuition", dueAmount: "" as string | number, academicYear: "2026" });
  const studentList = (students?.data ?? []) as Array<{ _id: string; name: string }>;
  const rows = ((data?.data ?? []) as LedgerRow[]).filter((row) => remaining(row) > 0);

  useEffect(() => {
    if (presetStudent) setForm((prev) => ({ ...prev, studentId: presetStudent }));
  }, [presetStudent]);

  return (
    <div>
      <PageHeader title={t.fees.duesTitle} subtitle={t.fees.duesSubtitle} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted-foreground">{t.fees.due}</p>
          <p className="text-2xl font-semibold tabular-nums">৳ {summary?.data.due ?? 0}</p>
        </Card>
        {(summary?.data.byClass ?? []).length ? (
          <Card>
            <p className="text-sm text-muted-foreground">{t.fees.byClass}</p>
            <p className="mt-2 text-sm">
              {(summary?.data.byClass ?? []).map((row) => `${row.name}: ৳ ${row.due}`).join(" · ") || "—"}
            </p>
          </Card>
        ) : null}
      </div>
      <FormPanel
        className="md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          toastApiResult(
            await createLedger({ ...form, dueAmount: parseNumberOrZero(form.dueAmount) }),
            t.fees.addDue,
            t.common.loadError
          );
        }}
      >
        <Field label={t.common.student}>
          <Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
            <option value="">{t.common.student}</option>
            {studentList.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.fees.titleField}>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label={t.fees.due}>
          <Input
            type="number"
            value={form.dueAmount}
            onChange={(e) => setForm({ ...form, dueAmount: e.target.value === "" ? "" : Number(e.target.value) })}
          />
        </Field>
        <Button type="submit">{t.fees.addDue}</Button>
      </FormPanel>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.fees.emptyDues} /> : null}
      <DataTable
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.common.student, cell: (row) => row.studentId?.name ?? "—" },
          { header: t.fees.titleField, cell: (row) => row.title },
          { header: t.fees.due, cell: (row) => remaining(row), align: "right" },
          { header: t.common.status, cell: (row) => row.status },
        ]}
      />
    </div>
  );
}

export default function FeeDuesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DuesInner />
    </Suspense>
  );
}
