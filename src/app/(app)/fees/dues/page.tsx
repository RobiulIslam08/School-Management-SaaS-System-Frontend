"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Banknote, Search, Wallet } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  useCreateLedgerMutation,
  useGetFeeSummaryQuery,
  useGetLedgersQuery,
  useGetStudentsQuery,
  useMeQuery,
} from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { parseNumberOrZero } from "@/lib/number-input";
import { cn } from "@/lib/utils";

type StudentOption = {
  _id: string;
  name: string;
  studentId?: string;
  classId?: { name?: string } | string;
};

type LedgerRow = {
  _id: string;
  title: string;
  dueAmount: number;
  paidAmount: number;
  discount?: number;
  status: string;
  academicYear?: string;
  studentId?: { name?: string; studentId?: string };
};

function remaining(row: LedgerRow): number {
  return Math.max(row.dueAmount - (row.discount ?? 0) - row.paidAmount, 0);
}

function money(n?: number) {
  return Number(n ?? 0).toLocaleString();
}

function DuesInner() {
  const { t } = useI18n();
  const search = useSearchParams();
  const presetStudent = search.get("studentId") ?? "";
  const { data: session } = useMeQuery();
  const academicYear = session?.data.settings?.academicYear || String(new Date().getFullYear());
  const { data: summary } = useGetFeeSummaryQuery();
  const { data, isLoading, isError, refetch } = useGetLedgersQuery(
    presetStudent ? { studentId: presetStudent } : undefined
  );
  const { data: students } = useGetStudentsQuery();
  const [createLedger] = useCreateLedgerMutation();

  const [form, setForm] = useState({
    studentId: presetStudent,
    title: "Tuition",
    dueAmount: "" as string | number,
    academicYear,
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const studentList = (students?.data ?? []) as StudentOption[];
  const allRows = (data?.data ?? []) as LedgerRow[];
  const rows = allRows.filter((row) => remaining(row) > 0);
  const selectedStudent = studentList.find((item) => item._id === form.studentId);

  useEffect(() => {
    if (presetStudent) setForm((prev) => ({ ...prev, studentId: presetStudent }));
  }, [presetStudent]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, academicYear }));
  }, [academicYear]);

  function statusLabel(status: string) {
    if (status === "due") return t.fees.due;
    if (status === "partial") return t.fees.partial;
    if (status === "paid") return t.fees.paid;
    return status;
  }

  const studentMatches = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return studentList.slice(0, 40);
    return studentList
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.studentId ?? "").toLowerCase().includes(query)
      )
      .slice(0, 40);
  }, [studentList, studentSearch]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (!query) return true;
      const name = row.studentId?.name?.toLowerCase() ?? "";
      const sid = row.studentId?.studentId?.toLowerCase() ?? "";
      return name.includes(query) || sid.includes(query) || row.title.toLowerCase().includes(query);
    });
  }, [rows, q, statusFilter]);

  const totalRemaining = filtered.reduce((sum, row) => sum + remaining(row), 0);
  const scopedDue = presetStudent
    ? rows.reduce((sum, row) => sum + remaining(row), 0)
    : Number(summary?.data.due ?? 0);

  return (
    <div>
      <PageHeader title={t.fees.duesTitle} subtitle={t.fees.duesSubtitle} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.fees.due}
          value={`৳ ${money(scopedDue)}`}
          icon={<Wallet size={18} />}
          tone="warning"
        />
        <StatCard label={t.fees.openLedgers} value={rows.length} icon={<Banknote size={18} />} />
        <StatCard label={t.fees.remaining} value={`৳ ${money(totalRemaining)}`} />
      </div>

      {!presetStudent && (summary?.data.byClass ?? []).length ? (
        <div className="mb-6 rounded-xl border border-border bg-white p-4 text-sm shadow-sm">
          <p className="mb-2 font-medium text-muted-foreground">{t.fees.byClass}</p>
          <p>
            {(summary?.data.byClass ?? []).map((row) => `${row.name}: ৳ ${row.due}`).join(" · ") || "—"}
          </p>
        </div>
      ) : null}

      <form
        className="mb-6 space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form.studentId) return;
          const dueAmount = parseNumberOrZero(form.dueAmount);
          if (dueAmount <= 0) return;
          const result = await createLedger({
            ...form,
            dueAmount,
          });
          if (toastApiResult(result, t.fees.addDue, t.common.loadError)) {
            setForm({
              studentId: presetStudent,
              title: "Tuition",
              dueAmount: "",
              academicYear,
            });
            setStudentSearch("");
          }
        }}
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label={t.common.student}>
            <Input
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value);
                if (form.studentId) setForm({ ...form, studentId: "" });
              }}
              placeholder={t.fees.searchStudent}
              autoComplete="off"
            />
            {selectedStudent ? (
              <p className="mt-1.5 text-sm font-medium">
                {selectedStudent.name}
                {selectedStudent.studentId ? ` · ${selectedStudent.studentId}` : ""}
              </p>
            ) : null}
            <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border">
              {studentMatches.length ? (
                studentMatches.map((item) => (
                  <li key={item._id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50",
                        form.studentId === item._id && "bg-primary/10 font-medium"
                      )}
                      onClick={() => {
                        setForm({ ...form, studentId: item._id });
                        setStudentSearch(
                          item.studentId ? `${item.name} · ${item.studentId}` : item.name
                        );
                      }}
                    >
                      <span className="truncate">{item.name}</span>
                      {item.studentId ? (
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {item.studentId}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-muted-foreground">{t.fees.noMatch}</li>
              )}
            </ul>
          </Field>
          <Field label={t.fees.titleField}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label={t.fees.due}>
            <Input
              type="number"
              min={1}
              step="1"
              value={form.dueAmount}
              onChange={(e) =>
                setForm({ ...form, dueAmount: e.target.value === "" ? "" : Number(e.target.value) })
              }
              required
            />
          </Field>
          <Field label={t.common.year}>
            <Input
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              required
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={!form.studentId}>
            {t.fees.addDue}
          </Button>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.fees.searchStudent}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto min-w-[9rem]"
        >
          <option value="">{t.fees.filterStatus}</option>
          <option value="due">{t.fees.due}</option>
          <option value="partial">{t.fees.partial}</option>
        </Select>
      </div>

      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !filtered.length ? <EmptyState title={t.fees.emptyDues} /> : null}

      <DataTable
        rows={filtered}
        rowKey={(row) => row._id}
        columns={[
          {
            header: t.common.student,
            cell: (row) => (
              <div>
                <p className="font-medium">{row.studentId?.name ?? "—"}</p>
                {row.studentId?.studentId ? (
                  <p className="font-mono text-xs text-muted-foreground">{row.studentId.studentId}</p>
                ) : null}
              </div>
            ),
          },
          {
            header: t.fees.studentId,
            cell: (row) => (
              <span className="font-mono text-sm">{row.studentId?.studentId ?? "—"}</span>
            ),
          },
          { header: t.fees.titleField, cell: (row) => row.title },
          {
            header: t.fees.due,
            cell: (row) => money(row.dueAmount),
            align: "right",
          },
          {
            header: t.fees.paid,
            cell: (row) => money(row.paidAmount),
            align: "right",
          },
          {
            header: t.fees.remaining,
            cell: (row) => <span className="font-semibold tabular-nums">{money(remaining(row))}</span>,
            align: "right",
          },
          {
            header: t.common.status,
            cell: (row) => (
              <StatusBadge
                label={statusLabel(row.status)}
                tone={row.status === "partial" ? "warning" : "danger"}
              />
            ),
          },
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
