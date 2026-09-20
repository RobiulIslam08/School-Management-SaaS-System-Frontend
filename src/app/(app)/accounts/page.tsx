"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Field, Select } from "@/components/ui";
import { useGetAccountsSummaryQuery } from "@/lib/api/financeApi";
import { useMeQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AccountsData = {
  year: string;
  month?: string;
  income: { total: number; fees: number; donations: number };
  expense: {
    total: number;
    operational: number;
    payroll: number;
    byCategory: Record<string, number>;
  };
  net: number;
  monthly: Array<{ month: string; income: number; expense: number; net: number }>;
};

function money(n?: number) {
  return Number(n ?? 0).toLocaleString();
}

function categoryLabel(t: { expenses: Record<string, string> }, category: string) {
  const key = `cat_${category}`;
  return t.expenses[key] || category;
}

export default function AccountsPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const now = new Date();
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [printMode, setPrintMode] = useState(false);

  const query = useMemo(
    () => ({
      year,
      month: mode === "monthly" ? month : undefined,
    }),
    [year, month, mode]
  );

  const { data, isLoading, isError, refetch } = useGetAccountsSummaryQuery(query);
  const summary = (data?.data ?? null) as AccountsData | null;
  const settings = session?.data.settings;
  const schoolName = settings?.name?.trim() || "School";

  const maxBar = useMemo(() => {
    const rows = summary?.monthly ?? [];
    if (!rows.length) return 1;
    return Math.max(...rows.flatMap((row) => [row.income, row.expense]), 1);
  }, [summary]);

  const byCategory = summary?.expense?.byCategory ?? {};

  useEffect(() => {
    if (!printMode) return;
    const id = window.setTimeout(() => window.print(), 200);
    return () => window.clearTimeout(id);
  }, [printMode]);

  function openPrint() {
    setPrintMode(true);
  }

  return (
    <div className="accounts-page">
      <div className="no-print">
        <PageHeader title={t.accounts.title} subtitle={t.accounts.subtitle} />

        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div className="inline-flex rounded-lg border border-border bg-white p-1">
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                mode === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => setMode("monthly")}
            >
              {t.accounts.monthly}
            </button>
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                mode === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => setMode("yearly")}
            >
              {t.accounts.yearly}
            </button>
          </div>
          <Field label={t.common.year}>
            <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-auto min-w-[7rem]">
              {[0, 1, 2, 3, 4].map((offset) => {
                const y = String(now.getFullYear() - offset);
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </Select>
          </Field>
          {mode === "monthly" ? (
            <Field label={t.accounts.monthly}>
              <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto min-w-[8rem]">
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  return (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  );
                })}
              </Select>
            </Field>
          ) : null}
          <Button type="button" variant="secondary" onClick={openPrint}>
            <Download size={14} className="mr-1" />
            {t.accounts.print}
          </Button>
        </div>

        {isLoading ? <TableSkeleton /> : null}
        {isError ? <QueryError onRetry={refetch} /> : null}

        {summary ? (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                label={t.accounts.income}
                value={`৳ ${money(summary.income.total)}`}
                icon={<TrendingUp size={18} />}
                tone="success"
              />
              <StatCard
                label={t.accounts.expense}
                value={`৳ ${money(summary.expense.total)}`}
                icon={<TrendingDown size={18} />}
                tone="danger"
              />
              <StatCard
                label={t.accounts.net}
                value={`৳ ${money(summary.net)}`}
                icon={<Scale size={18} />}
                tone={summary.net >= 0 ? "success" : "danger"}
                trend={summary.net >= 0 ? t.accounts.surplus : t.accounts.deficit}
              />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.accounts.income}
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt>{t.accounts.fromFees}</dt>
                    <dd className="font-semibold tabular-nums">৳ {money(summary.income.fees)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t.accounts.fromDonations}</dt>
                    <dd className="font-semibold tabular-nums">৳ {money(summary.income.donations)}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.accounts.expense}
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt>{t.accounts.operational}</dt>
                    <dd className="font-semibold tabular-nums">৳ {money(summary.expense.operational)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t.accounts.payroll}</dt>
                    <dd className="font-semibold tabular-nums">৳ {money(summary.expense.payroll)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t.accounts.breakdown}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(byCategory)
                  .filter(([, value]) => value > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, value]) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span>{categoryLabel(t, cat)}</span>
                      <span className="font-semibold tabular-nums">৳ {money(value)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {mode === "yearly" && summary.monthly?.length ? (
              <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.accounts.trend}
                </h2>
                <div className="flex h-40 items-end gap-2">
                  {summary.monthly.map((row) => (
                    <div key={row.month} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-28 w-full items-end justify-center gap-0.5">
                        <div
                          className="w-1/2 rounded-t bg-emerald-600/80"
                          style={{ height: `${Math.max(4, (row.income / maxBar) * 100)}%` }}
                          title={`Income ${money(row.income)}`}
                        />
                        <div
                          className="w-1/2 rounded-t bg-red-600/70"
                          style={{ height: `${Math.max(4, (row.expense / maxBar) * 100)}%` }}
                          title={`Expense ${money(row.expense)}`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{row.month.slice(5)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[28rem] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="pb-2">{t.accounts.monthly}</th>
                        <th className="pb-2 text-right">{t.accounts.income}</th>
                        <th className="pb-2 text-right">{t.accounts.expense}</th>
                        <th className="pb-2 text-right">{t.accounts.net}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.monthly.map((row) => (
                        <tr key={row.month} className="border-b border-border/60">
                          <td className="py-2">{row.month}</td>
                          <td className="py-2 text-right tabular-nums">{money(row.income)}</td>
                          <td className="py-2 text-right tabular-nums">{money(row.expense)}</td>
                          <td
                            className={cn(
                              "py-2 text-right tabular-nums font-medium",
                              row.net >= 0 ? "text-emerald-700" : "text-red-700"
                            )}
                          >
                            {money(row.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {printMode && summary ? (
        <div className="accounts-report-sheet mt-8">
          <div className="no-print mb-4 flex justify-end gap-2">
            <Button type="button" onClick={() => window.print()}>
              <Printer size={16} className="mr-1.5" />
              {t.accounts.print}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPrintMode(false)}>
              {t.common.close}
            </Button>
          </div>
          <div className="border border-foreground/70 bg-white p-8">
            <h1 className="text-xl font-bold uppercase tracking-wide">{schoolName}</h1>
            <p className="mt-1 text-lg font-semibold">{t.accounts.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "monthly" ? `${year}-${month}` : year}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-muted-foreground">{t.accounts.income}</p>
                <p className="text-xl font-bold tabular-nums">৳ {money(summary.income.total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t.accounts.expense}</p>
                <p className="text-xl font-bold tabular-nums">৳ {money(summary.expense.total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t.accounts.net}</p>
                <p className="text-xl font-bold tabular-nums">৳ {money(summary.net)}</p>
              </div>
            </div>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between border-b border-border py-2">
                <dt>{t.accounts.fromFees}</dt>
                <dd className="tabular-nums">৳ {money(summary.income.fees)}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <dt>{t.accounts.fromDonations}</dt>
                <dd className="tabular-nums">৳ {money(summary.income.donations)}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <dt>{t.accounts.operational}</dt>
                <dd className="tabular-nums">৳ {money(summary.expense.operational)}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <dt>{t.accounts.payroll}</dt>
                <dd className="tabular-nums">৳ {money(summary.expense.payroll)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
