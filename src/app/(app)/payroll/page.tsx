"use client";

import { useMemo, useState } from "react";
import { Banknote, Download, Printer, Wallet } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { PayslipInvoice } from "@/components/payslip-invoice";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  useCreatePayrollMutation,
  useGetPayrollQuery,
  useGetTeachersQuery,
  useMeQuery,
  usePayPayrollMutation,
} from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type TeacherOption = {
  _id: string;
  name: string;
  staffId?: string;
  photoUrl?: string;
  salaryStructure?: { basic?: number; house?: number; medical?: number; other?: number };
};

type PayrollRow = {
  _id: string;
  month: string;
  basic?: number;
  allowances?: number;
  advance?: number;
  deduction?: number;
  net: number;
  status: string;
  paidAt?: string;
  createdAt?: string;
  teacherId?: { name?: string; staffId?: string; photoUrl?: string };
};

function money(n?: number) {
  return Number(n ?? 0).toLocaleString();
}

export default function PayrollPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetPayrollQuery();
  const { data: teachers } = useGetTeachersQuery();
  const { data: session } = useMeQuery();
  const [createPayroll] = useCreatePayrollMutation();
  const [pay] = usePayPayrollMutation();

  const nowMonth = new Date().toISOString().slice(0, 7);
  const [form, setForm] = useState({ teacherId: "", month: nowMonth, advance: "0", deduction: "0" });
  const [teacherSearch, setTeacherSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<PayrollRow | null>(null);

  function openInvoice(row: PayrollRow, andPrint = false) {
    setPreview(row);
    if (andPrint) {
      window.setTimeout(() => window.print(), 120);
    }
  }

  const rows = (data?.data ?? []) as PayrollRow[];
  const teacherList = (teachers?.data ?? []) as TeacherOption[];
  const settings = session?.data.settings;
  const selectedTeacher = teacherList.find((item) => item._id === form.teacherId);

  const teacherMatches = useMemo(() => {
    const query = teacherSearch.trim().toLowerCase();
    if (!query) return teacherList.slice(0, 30);
    return teacherList
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.staffId ?? "").toLowerCase().includes(query)
      )
      .slice(0, 30);
  }, [teacherList, teacherSearch]);

  const estimatedNet = useMemo(() => {
    const basic = selectedTeacher?.salaryStructure?.basic ?? 0;
    const allowances =
      (selectedTeacher?.salaryStructure?.house ?? 0) +
      (selectedTeacher?.salaryStructure?.medical ?? 0) +
      (selectedTeacher?.salaryStructure?.other ?? 0);
    return basic + allowances - Number(form.advance || 0) - Number(form.deduction || 0);
  }, [selectedTeacher, form.advance, form.deduction]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (monthFilter && row.month !== monthFilter) return false;
      if (!query) return true;
      const name = row.teacherId?.name?.toLowerCase() ?? "";
      const staff = row.teacherId?.staffId?.toLowerCase() ?? "";
      return name.includes(query) || staff.includes(query) || row.month.includes(query);
    });
  }, [rows, statusFilter, monthFilter, q]);

  const paidCount = rows.filter((row) => row.status === "paid").length;
  const draftCount = rows.length - paidCount;
  const months = useMemo(() => Array.from(new Set(rows.map((row) => row.month))).sort().reverse(), [rows]);

  return (
    <div className="payroll-page">
      <div className="no-print">
        <PageHeader title={t.payroll.title} subtitle={t.payroll.subtitle} />
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label={t.payroll.totalSlips} value={rows.length} icon={<Wallet size={18} />} />
          <StatCard label={t.payroll.draft} value={draftCount} tone="warning" />
          <StatCard label={t.payroll.paidCount} value={paidCount} tone="success" icon={<Banknote size={18} />} />
        </div>

        <form
          className="mb-6 space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.teacherId) return;
            const result = await createPayroll({
              teacherId: form.teacherId,
              month: form.month,
              advance: Number(form.advance || 0),
              deduction: Number(form.deduction || 0),
            });
            if (toastApiResult(result, t.payroll.create, t.common.loadError)) {
              setForm({ teacherId: "", month: nowMonth, advance: "0", deduction: "0" });
              setTeacherSearch("");
            }
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t.common.teacher}>
              <Input
                value={teacherSearch}
                onChange={(e) => {
                  setTeacherSearch(e.target.value);
                  if (form.teacherId) setForm({ ...form, teacherId: "" });
                }}
                placeholder={t.payroll.teacherSearch}
                autoComplete="off"
              />
              {selectedTeacher ? (
                <p className="mt-1.5 text-sm font-medium">
                  {selectedTeacher.name}
                  {selectedTeacher.staffId ? ` · ${selectedTeacher.staffId}` : ""}
                </p>
              ) : null}
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border">
                {teacherMatches.length ? (
                  teacherMatches.map((item) => (
                    <li key={item._id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50",
                          form.teacherId === item._id && "bg-primary/10 font-medium"
                        )}
                        onClick={() => {
                          setForm({ ...form, teacherId: item._id });
                          setTeacherSearch(
                            item.staffId ? `${item.name} · ${item.staffId}` : item.name
                          );
                        }}
                      >
                        <span className="truncate">{item.name}</span>
                        {item.staffId ? (
                          <span className="shrink-0 text-xs text-muted-foreground">{item.staffId}</span>
                        ) : null}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-muted-foreground">{t.payroll.noTeacher}</li>
                )}
              </ul>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t.payroll.month}>
                <Input
                  type="month"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  required
                />
              </Field>
              <Field label={t.payroll.net}>
                <Input value={money(estimatedNet)} readOnly />
              </Field>
              <Field label={t.payroll.advance}>
                <Input
                  type="number"
                  min={0}
                  value={form.advance}
                  onChange={(e) => setForm({ ...form, advance: e.target.value })}
                />
              </Field>
              <Field label={t.payroll.deduction}>
                <Input
                  type="number"
                  min={0}
                  value={form.deduction}
                  onChange={(e) => setForm({ ...form, deduction: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!form.teacherId}>
              {t.payroll.create}
            </Button>
          </div>
        </form>

        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.payroll.searchTeacher}
          />
          <Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-auto min-w-[9rem]">
            <option value="">{t.payroll.month}</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto min-w-[9rem]">
            <option value="">{t.payroll.filterStatus}</option>
            <option value="draft">{t.payroll.draft}</option>
            <option value="paid">{t.fees.paid}</option>
          </Select>
        </div>

        {isLoading ? <TableSkeleton /> : null}
        {isError ? <QueryError onRetry={refetch} /> : null}
        {!isLoading && !filtered.length ? <EmptyState title={t.payroll.empty} hint={t.payroll.emptyHint} /> : null}

        <DataTable
          rows={filtered}
          rowKey={(row) => row._id}
          columns={[
            {
              header: t.common.teacher,
              cell: (row) => (
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-primary/10 text-xs font-semibold text-primary">
                    {row.teacherId?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.teacherId.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{row.teacherId?.name?.slice(0, 1) || "T"}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{row.teacherId?.name ?? "—"}</p>
                    {row.teacherId?.staffId ? (
                      <p className="text-xs text-muted-foreground">{row.teacherId.staffId}</p>
                    ) : null}
                  </div>
                </div>
              ),
            },
            { header: t.payroll.month, cell: (row) => row.month },
            { header: t.payroll.basic, cell: (row) => money(row.basic), align: "right" },
            { header: t.payroll.net, cell: (row) => money(row.net), align: "right" },
            {
              header: t.common.status,
              cell: (row) => (
                <StatusBadge
                  label={row.status === "paid" ? t.fees.paid : t.payroll.draft}
                  tone={row.status === "paid" ? "success" : "warning"}
                />
              ),
            },
            {
              header: t.common.actions,
              cell: (row) => (
                <div className="flex flex-wrap gap-1">
                  <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => openInvoice(row)}>
                    {t.payroll.preview}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 px-2"
                    onClick={() => openInvoice(row, true)}
                  >
                    <Download size={14} className="mr-1" />
                    {t.payroll.downloadPdf}
                  </Button>
                  {row.status !== "paid" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 px-2"
                      onClick={async () => toastApiResult(await pay(row._id), t.payroll.markPaid, t.common.loadError)}
                    >
                      {t.payroll.markPaid}
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>

      {preview ? (
        <div className="mt-8">
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{t.payroll.preview}</h2>
              <p className="text-sm text-muted-foreground">{t.payroll.invoiceFooter}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => window.print()}>
                <Download size={16} className="mr-1.5" />
                {t.payroll.downloadPdf}
              </Button>
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                <Printer size={16} className="mr-1.5" />
                {t.payroll.printSlip}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPreview(null)}>
                {t.common.close}
              </Button>
            </div>
          </div>
          <PayslipInvoice item={preview} settings={settings} />
        </div>
      ) : null}
    </div>
  );
}
