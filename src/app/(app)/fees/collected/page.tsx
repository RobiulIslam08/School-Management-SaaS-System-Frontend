"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Search, Wallet } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { FeeReceipt, type FeeReceiptData } from "@/components/fee-receipt";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  useAddPaymentMutation,
  useGetFeeSummaryQuery,
  useGetLedgersQuery,
  useMeQuery,
} from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { parseNumberOrZero } from "@/lib/number-input";
import { cn } from "@/lib/utils";

const METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank Transfer", "Cheque", "Other"];

type PaymentRow = {
  _id?: string;
  amount: number;
  method: string;
  refNo?: string;
  date?: string;
  note?: string;
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
  payments?: PaymentRow[];
};

type ReceiptPreview = FeeReceiptData;

function remaining(row: LedgerRow): number {
  return Math.max(row.dueAmount - (row.discount ?? 0) - row.paidAmount, 0);
}

function money(n?: number) {
  return Number(n ?? 0).toLocaleString();
}

export default function FeeCollectedPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const { data: summary } = useGetFeeSummaryQuery();
  const { data, isLoading, isError, refetch } = useGetLedgersQuery();
  const [addPayment] = useAddPaymentMutation();
  const [pay, setPay] = useState({
    id: "",
    amount: "" as string | number,
    method: "Cash",
    refNo: "",
  });
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [q, setQ] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [preview, setPreview] = useState<ReceiptPreview | null>(null);
  const [printQueued, setPrintQueued] = useState(false);

  const allRows = (data?.data ?? []) as LedgerRow[];
  const openLedgers = allRows.filter((row) => remaining(row) > 0);
  const collectedRows = allRows.filter((row) => row.paidAmount > 0);
  const settings = session?.data.settings;
  const selectedLedger = openLedgers.find((row) => row._id === pay.id);
  const maxPay = selectedLedger ? remaining(selectedLedger) : undefined;

  const ledgerMatches = useMemo(() => {
    const query = ledgerSearch.trim().toLowerCase();
    if (!query) return openLedgers.slice(0, 40);
    return openLedgers
      .filter((row) => {
        const name = row.studentId?.name?.toLowerCase() ?? "";
        const sid = row.studentId?.studentId?.toLowerCase() ?? "";
        return name.includes(query) || sid.includes(query) || row.title.toLowerCase().includes(query);
      })
      .slice(0, 40);
  }, [openLedgers, ledgerSearch]);

  const transactions = useMemo(() => {
    const items: Array<{
      key: string;
      ledger: LedgerRow;
      payment: PaymentRow;
    }> = [];
    for (const ledger of collectedRows) {
      (ledger.payments ?? []).forEach((payment, index) => {
        items.push({
          key: `${ledger._id}-${payment._id ?? `${index}-${payment.date ?? ""}-${payment.amount}-${payment.method}`}`,
          ledger,
          payment,
        });
      });
    }
    return items.sort((a, b) => {
      const da = a.payment.date ? new Date(a.payment.date).getTime() : 0;
      const db = b.payment.date ? new Date(b.payment.date).getTime() : 0;
      return db - da;
    });
  }, [collectedRows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return transactions.filter((row) => {
      if (methodFilter && row.payment.method !== methodFilter) return false;
      if (!query) return true;
      const name = row.ledger.studentId?.name?.toLowerCase() ?? "";
      const sid = row.ledger.studentId?.studentId?.toLowerCase() ?? "";
      return (
        name.includes(query) ||
        sid.includes(query) ||
        row.ledger.title.toLowerCase().includes(query) ||
        (row.payment.refNo ?? "").toLowerCase().includes(query)
      );
    });
  }, [transactions, q, methodFilter]);

  useEffect(() => {
    if (!preview || !printQueued) return;
    const id = window.setTimeout(() => {
      window.print();
      setPrintQueued(false);
    }, 200);
    return () => window.clearTimeout(id);
  }, [preview, printQueued]);

  function openReceipt(ledger: LedgerRow, payment: PaymentRow, andPrint = false) {
    setPreview({
      payment,
      title: ledger.title,
      studentName: ledger.studentId?.name,
      studentId: ledger.studentId?.studentId,
      academicYear: ledger.academicYear,
      dueAmount: ledger.dueAmount,
      paidAmount: ledger.paidAmount,
      ledgerId: ledger._id,
    });
    if (andPrint) setPrintQueued(true);
  }

  return (
    <div className="fees-collected-page">
      <div className="no-print">
        <PageHeader title={t.fees.collectedTitle} subtitle={t.fees.collectedSubtitle} />

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label={t.fees.collected}
            value={`৳ ${money(summary?.data.collected ?? 0)}`}
            icon={<Wallet size={18} />}
            tone="success"
          />
          <StatCard label={t.fees.transactions} value={transactions.length} />
          <StatCard label={t.fees.openLedgers} value={openLedgers.length} tone="warning" />
        </div>

        {Object.keys(summary?.data.byMethod ?? {}).length ? (
          <div className="mb-6 rounded-xl border border-border bg-white p-4 text-sm shadow-sm">
            <p className="mb-2 font-medium text-muted-foreground">{t.fees.methods}</p>
            <p>
              {Object.entries(summary?.data.byMethod ?? {})
                .map(([key, value]) => `${key}: ৳ ${money(Number(value))}`)
                .join(" · ") || "—"}
            </p>
          </div>
        ) : null}

        <form
          className="mb-6 space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!pay.id || !selectedLedger) return;
            const amount = parseNumberOrZero(pay.amount);
            if (amount <= 0) return;
            if (amount > remaining(selectedLedger)) return;
            const result = await addPayment({
              ...pay,
              amount,
            });
            if (toastApiResult(result, t.fees.recordPay, t.common.loadError)) {
              setPay({ id: "", amount: "", method: "Cash", refNo: "" });
              setLedgerSearch("");
            }
          }}
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Field label={t.fees.ledger}>
              <Input
                value={ledgerSearch}
                onChange={(e) => {
                  setLedgerSearch(e.target.value);
                  if (pay.id) setPay({ ...pay, id: "" });
                }}
                placeholder={t.fees.searchStudent}
                autoComplete="off"
              />
              {selectedLedger ? (
                <p className="mt-1.5 text-sm font-medium">
                  {selectedLedger.studentId?.name ?? "—"}
                  {selectedLedger.studentId?.studentId
                    ? ` · ${selectedLedger.studentId.studentId}`
                    : ""}
                  {` · ${selectedLedger.title} (৳ ${money(remaining(selectedLedger))})`}
                </p>
              ) : null}
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border">
                {ledgerMatches.length ? (
                  ledgerMatches.map((row) => (
                    <li key={row._id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/50",
                          pay.id === row._id && "bg-primary/10 font-medium"
                        )}
                        onClick={() => {
                          setPay({ ...pay, id: row._id });
                          setLedgerSearch(
                            `${row.studentId?.name ?? ""} · ${row.studentId?.studentId ?? ""} · ${row.title}`
                          );
                        }}
                      >
                        <span className="flex w-full justify-between gap-2">
                          <span className="truncate">{row.studentId?.name ?? "—"}</span>
                          <span className="shrink-0 font-mono text-xs text-muted-foreground">
                            {row.studentId?.studentId ?? "—"}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {row.title} · ৳ {money(remaining(row))}
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-muted-foreground">{t.fees.noMatch}</li>
                )}
              </ul>
            </Field>
            <Field label={t.common.amount}>
              <Input
                type="number"
                min={1}
                max={maxPay}
                step="1"
                value={pay.amount}
                onChange={(e) =>
                  setPay({ ...pay, amount: e.target.value === "" ? "" : Number(e.target.value) })
                }
                required
              />
            </Field>
            <Field label={t.fees.method}>
              <Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                {METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.fees.ref}>
              <Input value={pay.refNo} onChange={(e) => setPay({ ...pay, refNo: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!pay.id}>
              {t.fees.recordPay}
            </Button>
          </div>
        </form>

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative max-w-xs flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.fees.searchStudent}
            />
          </div>
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-auto min-w-[9rem]"
          >
            <option value="">{t.fees.methods}</option>
            {METHODS.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </Select>
        </div>

        {isLoading ? <TableSkeleton /> : null}
        {isError ? <QueryError onRetry={refetch} /> : null}
        {!isLoading && !filtered.length ? <EmptyState title={t.fees.emptyCollected} /> : null}

        <DataTable
          rows={filtered}
          rowKey={(row) => row.key}
          columns={[
            {
              header: t.common.student,
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.ledger.studentId?.name ?? "—"}</p>
                  {row.ledger.studentId?.studentId ? (
                    <p className="font-mono text-xs text-muted-foreground">
                      {row.ledger.studentId.studentId}
                    </p>
                  ) : null}
                </div>
              ),
            },
            {
              header: t.fees.studentId,
              cell: (row) => (
                <span className="font-mono text-sm">{row.ledger.studentId?.studentId ?? "—"}</span>
              ),
            },
            { header: t.fees.titleField, cell: (row) => row.ledger.title },
            {
              header: t.common.date,
              cell: (row) =>
                row.payment.date ? new Date(row.payment.date).toLocaleDateString() : "—",
            },
            { header: t.fees.method, cell: (row) => row.payment.method },
            {
              header: t.fees.amount,
              cell: (row) => money(row.payment.amount),
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
                    onClick={() => openReceipt(row.ledger, row.payment)}
                  >
                    {t.common.view}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 px-2"
                    onClick={() => openReceipt(row.ledger, row.payment, true)}
                  >
                    <Download size={14} className="mr-1" />
                    {t.fees.downloadReceipt}
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
              <h2 className="text-lg font-semibold">{t.fees.moneyReceipt}</h2>
              <p className="text-sm text-muted-foreground">{t.fees.receiptFooter}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => window.print()}>
                <Download size={16} className="mr-1.5" />
                {t.fees.downloadReceipt}
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
          <FeeReceipt item={preview} settings={settings} />
        </div>
      ) : null}
    </div>
  );
}
