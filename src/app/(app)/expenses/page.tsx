"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Receipt, Wallet } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseSummaryQuery,
  useGetExpensesQuery,
} from "@/lib/api/financeApi";
import { useI18n } from "@/lib/i18n";
import { parseNumberOrZero } from "@/lib/number-input";
import { toLocalYmd } from "@/lib/utils";

const CATEGORIES = [
  "utilities",
  "supplies",
  "maintenance",
  "transport",
  "events",
  "food",
  "exam",
  "rent",
  "other",
] as const;

const METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank Transfer", "Cheque", "Other"];

type ExpenseRow = {
  _id: string;
  date?: string;
  amount: number;
  category: string;
  title: string;
  vendor?: string;
  paidByName?: string;
  paidVia?: string;
  refNo?: string;
  note?: string;
};

function money(n?: number) {
  return Number(n ?? 0).toLocaleString();
}

function categoryLabel(
  t: { expenses: Record<string, string> },
  category: string
) {
  const key = `cat_${category}`;
  return t.expenses[key] || category;
}

export default function ExpensesPage() {
  const { t } = useI18n();
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(currentMonth);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [printMode, setPrintMode] = useState(false);

  const query = useMemo(
    () => ({
      year,
      month: month || undefined,
      category: category || undefined,
      q: q.trim() || undefined,
    }),
    [year, month, category, q]
  );

  const { data, isLoading, isError, refetch } = useGetExpensesQuery(query);
  const { data: summary } = useGetExpenseSummaryQuery({ year, month: month || undefined });
  const [createExpense] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const [form, setForm] = useState({
    date: toLocalYmd(),
    amount: "" as string | number,
    category: "utilities",
    title: "",
    vendor: "",
    paidByName: "",
    paidVia: "Cash",
    refNo: "",
    note: "",
  });

  const rows = (data?.data ?? []) as ExpenseRow[];
  const byCategory = (summary?.data?.byCategory ?? {}) as Record<string, number>;
  const total = Number(summary?.data?.total ?? 0);
  const count = Number(summary?.data?.count ?? 0);
  const amountLabel =
    month && year === String(now.getFullYear()) && month === currentMonth
      ? t.expenses.thisMonth
      : t.expenses.total;

  useEffect(() => {
    if (!printMode) return;
    const id = window.setTimeout(() => window.print(), 200);
    return () => window.clearTimeout(id);
  }, [printMode]);

  function openPrint() {
    setPrintMode(true);
  }

  return (
    <div className="expenses-page">
      <div className="no-print">
        <PageHeader title={t.expenses.title} subtitle={t.expenses.subtitle} />
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label={amountLabel} value={`৳ ${money(total)}`} icon={<Wallet size={18} />} />
          <StatCard label={t.expenses.entries} value={count} />
          <StatCard
            label={t.expenses.category}
            value={Object.values(byCategory).filter((v) => v > 0).length}
            icon={<Receipt size={18} />}
          />
        </div>

        <form
          className="mb-6 space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            const amount = parseNumberOrZero(form.amount);
            if (amount <= 0) return;
            const result = await createExpense({
              date: form.date,
              amount,
              category: form.category,
              title: form.title,
              vendor: form.vendor,
              paidByName: form.paidByName,
              paidVia: form.paidVia,
              refNo: form.refNo,
              note: form.note,
            });
            if (toastApiResult(result, t.expenses.add, t.common.loadError)) {
              setForm({
                date: toLocalYmd(),
                amount: "",
                category: "utilities",
                title: "",
                vendor: "",
                paidByName: "",
                paidVia: "Cash",
                refNo: "",
                note: "",
              });
            }
          }}
        >
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <Field label={t.common.date}>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </Field>
            <Field label={t.common.amount}>
              <Input
                type="number"
                min={1}
                step="1"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value === "" ? "" : Number(e.target.value) })
                }
                required
              />
            </Field>
            <Field label={t.expenses.category}>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabel(t, cat)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.fees.titleField}>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </Field>
            <Field label={t.expenses.vendor}>
              <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            </Field>
            <Field label={t.expenses.paidBy}>
              <Input
                value={form.paidByName}
                onChange={(e) => setForm({ ...form, paidByName: e.target.value })}
              />
            </Field>
            <Field label={t.expenses.paidVia}>
              <Select value={form.paidVia} onChange={(e) => setForm({ ...form, paidVia: e.target.value })}>
                {METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.fees.ref}>
              <Input value={form.refNo} onChange={(e) => setForm({ ...form, refNo: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit">{t.expenses.add}</Button>
          </div>
        </form>

        <div className="mb-4 flex flex-wrap gap-3">
          <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-auto min-w-[7rem]">
            {[0, 1, 2].map((offset) => {
              const y = String(now.getFullYear() - offset);
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </Select>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto min-w-[8rem]">
            <option value="">{t.common.all}</option>
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, "0");
              return (
                <option key={m} value={m}>
                  {m}
                </option>
              );
            })}
          </Select>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-auto min-w-[10rem]"
          >
            <option value="">{t.common.all}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabel(t, cat)}
              </option>
            ))}
          </Select>
          <Input
            className="max-w-xs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.common.search}
          />
          <Button type="button" variant="secondary" onClick={openPrint}>
            <Download size={14} className="mr-1" />
            {t.expenses.print}
          </Button>
        </div>

        {Object.keys(byCategory).some((k) => byCategory[k] > 0) ? (
          <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.filter((cat) => byCategory[cat] > 0).map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <span>{categoryLabel(t, cat)}</span>
                <span className="font-semibold tabular-nums">৳ {money(byCategory[cat])}</span>
              </div>
            ))}
          </div>
        ) : null}

        {isLoading ? <TableSkeleton /> : null}
        {isError ? <QueryError onRetry={refetch} /> : null}
        {!isLoading && !rows.length ? (
          <EmptyState title={t.expenses.empty} hint={t.expenses.emptyHint} />
        ) : null}

        <DataTable
          rows={rows}
          rowKey={(row) => row._id}
          columns={[
            {
              header: t.common.date,
              cell: (row) => (row.date ? new Date(row.date).toLocaleDateString() : "—"),
            },
            { header: t.fees.titleField, cell: (row) => row.title },
            {
              header: t.expenses.category,
              cell: (row) => categoryLabel(t, row.category),
            },
            { header: t.expenses.vendor, cell: (row) => row.vendor || "—" },
            { header: t.expenses.paidVia, cell: (row) => row.paidVia || "—" },
            {
              header: t.common.amount,
              cell: (row) => money(row.amount),
              align: "right",
            },
            {
              header: t.common.actions,
              cell: (row) => (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-red-700"
                  onClick={async () => {
                    if (!window.confirm(t.expenses.deleteAsk)) return;
                    toastApiResult(await deleteExpense(row._id), t.common.delete, t.common.loadError);
                  }}
                >
                  {t.common.delete}
                </Button>
              ),
            },
          ]}
        />
      </div>

      {printMode ? (
        <div className="expense-report-sheet mt-8">
          <div className="no-print mb-4 flex justify-end gap-2">
            <Button type="button" onClick={() => window.print()}>
              <Printer size={16} className="mr-1.5" />
              {t.expenses.print}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPrintMode(false)}>
              {t.common.close}
            </Button>
          </div>
          <div className="border border-foreground/70 bg-white p-8">
            <h1 className="text-xl font-bold">{t.expenses.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {year}
              {month ? `-${month}` : ""} · ৳ {money(total)}
            </p>
            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="border-b-2 border-foreground/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2">{t.common.date}</th>
                  <th className="pb-2">{t.fees.titleField}</th>
                  <th className="pb-2">{t.expenses.category}</th>
                  <th className="pb-2 text-right">{t.common.amount}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id} className="border-b border-border">
                    <td className="py-2">{row.date ? new Date(row.date).toLocaleDateString() : "—"}</td>
                    <td className="py-2">{row.title}</td>
                    <td className="py-2">{categoryLabel(t, row.category)}</td>
                    <td className="py-2 text-right tabular-nums">{money(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
