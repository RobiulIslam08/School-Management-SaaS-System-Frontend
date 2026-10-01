"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [printNonce, setPrintNonce] = useState(0);
  const sheetAnchor = useRef<HTMLDivElement | null>(null);

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

  function openPrint() {
    setPrintMode(true);
    setPrintNonce((n) => n + 1);
  }

  useEffect(() => {
    if (!printNonce || !printMode || !summary) return;
    sheetAnchor.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [printNonce, printMode, summary]);

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
        <div ref={sheetAnchor} className="accounts-report-sheet mt-8 scroll-mt-20">
          <div className="no-print mb-4 flex justify-end gap-2">
            <Button type="button" onClick={() => window.print()}>
              <Printer size={16} className="mr-1.5" />
              {t.accounts.print}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPrintMode(false)}>
              {t.common.close}
            </Button>
          </div>
          <article className="mx-auto max-w-[210mm] border-[3px] border-foreground bg-white text-foreground">
            <div className="border border-foreground/70 p-3 sm:p-6">
              <header className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 border-b-2 border-foreground pb-4 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-4">
                <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center overflow-hidden rounded-full border-2 border-foreground sm:h-[4.5rem] sm:w-[4.5rem]">
                  {settings?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.logoUrl} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl font-bold">{schoolName.slice(0, 1)}</span>
                  )}
                </div>
                <div className="min-w-0 text-center">
                  {settings?.motto ? <p className="text-[11px] italic text-muted-foreground">{settings.motto}</p> : null}
                  <h1 className="break-words text-lg font-extrabold uppercase leading-tight tracking-wide sm:text-2xl">{schoolName}</h1>
                  {settings?.address ? <p className="mt-1 text-sm">{settings.address}</p> : null}
                  <p className="mt-1 text-xs">
                    {settings?.eiin ? `${t.marksheets.eiin}: ${settings.eiin}` : null}
                    {settings?.eiin && settings?.establishedYear ? "  ·  " : null}
                    {settings?.establishedYear ? `Est. ${settings.establishedYear}` : null}
                    {(settings?.eiin || settings?.establishedYear) && settings?.academicYear ? "  ·  " : null}
                    {settings?.academicYear ? `${t.common.year}: ${settings.academicYear}` : null}
                  </p>
                </div>
              </header>
              <div className="mt-4 flex flex-col gap-2 border-b border-foreground/30 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <div>
                  <p className="text-lg font-bold uppercase tracking-[0.12em]">{t.accounts.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === "monthly" ? `${year}-${month}` : year}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {summary.net >= 0 ? t.accounts.surplus : t.accounts.deficit}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div className="border border-foreground/30 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.accounts.income}</p>
                  <p className="mt-1 text-base font-bold tabular-nums sm:text-lg">৳ {money(summary.income.total)}</p>
                </div>
                <div className="border border-foreground/30 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.accounts.expense}</p>
                  <p className="mt-1 text-base font-bold tabular-nums sm:text-lg">৳ {money(summary.expense.total)}</p>
                </div>
                <div className="border border-foreground/30 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.accounts.net}</p>
                  <p className="mt-1 text-base font-bold tabular-nums sm:text-lg">৳ {money(summary.net)}</p>
                </div>
              </div>
              <table className="mt-5 w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground text-left text-xs uppercase tracking-wider">
                    <th className="py-2">{t.fees.titleField}</th>
                    <th className="py-2 text-right">{t.fees.amount}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-foreground/20">
                    <td className="py-2">{t.accounts.fromFees}</td>
                    <td className="py-2 text-right tabular-nums">৳ {money(summary.income.fees)}</td>
                  </tr>
                  <tr className="border-b border-foreground/20">
                    <td className="py-2">{t.accounts.fromDonations}</td>
                    <td className="py-2 text-right tabular-nums">৳ {money(summary.income.donations)}</td>
                  </tr>
                  <tr className="border-b border-foreground/20">
                    <td className="py-2">{t.accounts.operational}</td>
                    <td className="py-2 text-right tabular-nums">৳ {money(summary.expense.operational)}</td>
                  </tr>
                  <tr className="border-b border-foreground/20">
                    <td className="py-2">{t.accounts.payroll}</td>
                    <td className="py-2 text-right tabular-nums">৳ {money(summary.expense.payroll)}</td>
                  </tr>
                  {Object.entries(byCategory)
                    .filter(([, value]) => value > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, value]) => (
                      <tr key={cat} className="border-b border-foreground/20">
                        <td className="py-2 pl-4 text-muted-foreground">{categoryLabel(t, cat)}</td>
                        <td className="py-2 text-right tabular-nums">৳ {money(value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {mode === "yearly" && summary.monthly?.length ? (
                <div className="mt-6 overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[20rem] text-sm print:min-w-0">
                  <thead>
                    <tr className="border-b-2 border-foreground text-left text-xs uppercase tracking-wider">
                      <th className="py-2">{t.accounts.monthly}</th>
                      <th className="py-2 text-right">{t.accounts.income}</th>
                      <th className="py-2 text-right">{t.accounts.expense}</th>
                      <th className="py-2 text-right">{t.accounts.net}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.monthly.map((row) => (
                      <tr key={row.month} className="border-b border-foreground/20">
                        <td className="py-1.5">{row.month}</td>
                        <td className="py-1.5 text-right tabular-nums">{money(row.income)}</td>
                        <td className="py-1.5 text-right tabular-nums">{money(row.expense)}</td>
                        <td className="py-1.5 text-right tabular-nums font-medium">{money(row.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              ) : null}
              <div className="mt-10 grid grid-cols-2 gap-4 text-center text-xs sm:mt-16 sm:gap-12">
                <div>
                  <div className="mx-auto mb-2 h-10 max-w-[11rem] border-b border-foreground" />
                  <p className="font-semibold">{t.staff.accountant}</p>
                </div>
                <div>
                  <div className="mx-auto mb-2 h-10 max-w-[11rem] border-b border-foreground" />
                  <p className="font-semibold">{t.staff.admin}</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}
