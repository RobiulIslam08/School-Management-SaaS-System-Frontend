"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, HeartHandshake, Printer, Wallet } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DonationReceipt, type DonationReceiptData } from "@/components/donation-receipt";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  useCreateDonationMutation,
  useDeleteDonationMutation,
  useGetDonationSummaryQuery,
  useGetDonationsQuery,
} from "@/lib/api/financeApi";
import { useMeQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { parseNumberOrZero } from "@/lib/number-input";
import { toLocalYmd } from "@/lib/utils";

const METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank Transfer", "Cheque", "Other"];

type DonationRow = DonationReceiptData & {
  createdAt?: string;
};

function money(n?: number) {
  return Number(n ?? 0).toLocaleString();
}

export default function DonationsPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<DonationRow | null>(null);
  const [printQueued, setPrintQueued] = useState(false);

  const query = useMemo(
    () => ({
      year,
      month: month || undefined,
      q: q.trim() || undefined,
    }),
    [year, month, q]
  );

  const { data, isLoading, isError, refetch } = useGetDonationsQuery(query);
  const { data: summary } = useGetDonationSummaryQuery({
    year,
    month: month || undefined,
  });
  const [createDonation] = useCreateDonationMutation();
  const [deleteDonation] = useDeleteDonationMutation();

  const [form, setForm] = useState({
    date: toLocalYmd(),
    amount: "" as string | number,
    donorName: "",
    donorPhone: "",
    donorAddress: "",
    purpose: "",
    method: "Cash",
    refNo: "",
    note: "",
  });

  const rows = (data?.data ?? []) as DonationRow[];
  const settings = session?.data.settings;
  const total = Number(summary?.data?.total ?? 0);
  const count = Number(summary?.data?.count ?? 0);

  useEffect(() => {
    if (!preview || !printQueued) return;
    const id = window.setTimeout(() => {
      window.print();
      setPrintQueued(false);
    }, 200);
    return () => window.clearTimeout(id);
  }, [preview, printQueued]);

  function openReceipt(row: DonationRow, andPrint = false) {
    setPreview(row);
    if (andPrint) setPrintQueued(true);
  }

  return (
    <div className="donations-page">
      <div className="no-print">
        <PageHeader title={t.donations.title} subtitle={t.donations.subtitle} />
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <StatCard
            label={t.donations.thisMonth}
            value={`৳ ${money(total)}`}
            icon={<HeartHandshake size={18} />}
            tone="success"
          />
          <StatCard label={t.expenses.entries} value={count} icon={<Wallet size={18} />} />
        </div>

        <form
          className="mb-6 space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            const amount = parseNumberOrZero(form.amount);
            if (amount <= 0) return;
            const result = await createDonation({
              date: form.date,
              amount,
              donorName: form.donorName,
              donorPhone: form.donorPhone,
              donorAddress: form.donorAddress,
              purpose: form.purpose,
              method: form.method,
              refNo: form.refNo,
              note: form.note,
            });
            if (toastApiResult(result, t.donations.add, t.common.loadError)) {
              setForm({
                date: toLocalYmd(),
                amount: "",
                donorName: "",
                donorPhone: "",
                donorAddress: "",
                purpose: "",
                method: "Cash",
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
            <Field label={t.donations.donor}>
              <Input
                value={form.donorName}
                onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                required
              />
            </Field>
            <Field label={t.donations.phone}>
              <Input
                value={form.donorPhone}
                onChange={(e) => setForm({ ...form, donorPhone: e.target.value })}
              />
            </Field>
            <Field label={t.donations.purpose}>
              <Input
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </Field>
            <Field label={t.fees.method}>
              <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.fees.ref}>
              <Input value={form.refNo} onChange={(e) => setForm({ ...form, refNo: e.target.value })} />
            </Field>
            <Field label={t.donations.address}>
              <Input
                value={form.donorAddress}
                onChange={(e) => setForm({ ...form, donorAddress: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit">{t.donations.add}</Button>
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
          <Input
            className="max-w-xs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.common.search}
          />
        </div>

        {isLoading ? <TableSkeleton /> : null}
        {isError ? <QueryError onRetry={refetch} /> : null}
        {!isLoading && !rows.length ? (
          <EmptyState title={t.donations.empty} hint={t.donations.emptyHint} />
        ) : null}

        <DataTable
          rows={rows}
          rowKey={(row) => row._id}
          columns={[
            {
              header: t.common.date,
              cell: (row) => (row.date ? new Date(row.date).toLocaleDateString() : "—"),
            },
            { header: t.donations.donor, cell: (row) => row.donorName },
            { header: t.donations.purpose, cell: (row) => row.purpose || "—" },
            { header: t.donations.receipt, cell: (row) => row.receiptNo || "—" },
            { header: t.fees.method, cell: (row) => row.method || "—" },
            {
              header: t.common.amount,
              cell: (row) => money(row.amount),
              align: "right",
            },
            {
              header: t.common.actions,
              cell: (row) => (
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => openReceipt(row)}
                  >
                    {t.common.view}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 px-2"
                    onClick={() => openReceipt(row, true)}
                  >
                    <Download size={14} className="mr-1" />
                    {t.donations.downloadReceipt}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2 text-red-700"
                    onClick={async () => {
                      if (!window.confirm(t.donations.deleteAsk)) return;
                      toastApiResult(await deleteDonation(row._id), t.common.delete, t.common.loadError);
                    }}
                  >
                    {t.common.delete}
                  </Button>
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
              <h2 className="text-lg font-semibold">{t.donations.receiptTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.donations.receiptFooter}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => window.print()}>
                <Download size={16} className="mr-1.5" />
                {t.donations.downloadReceipt}
              </Button>
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                <Printer size={16} className="mr-1.5" />
                {t.common.print}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPreview(null)}>
                {t.common.close}
              </Button>
            </div>
          </div>
          <DonationReceipt item={preview} settings={settings} />
        </div>
      ) : null}
    </div>
  );
}
