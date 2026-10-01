"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Printer, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { FeeReceipt, type FeeReceiptData } from "@/components/fee-receipt";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Field, Input, Select } from "@/components/ui";
import { useGetFeeSummaryQuery, useGetLedgersQuery, useGetStudentsQuery, useMeQuery, useRecordFeePaymentsMutation } from "@/lib/api/schoolApi";
import { FEE_HEADS, defaultFeePeriod, feeHeadName, feeParticular, feeTitleMatchesHead } from "@/lib/fee-heads";
import { useI18n } from "@/lib/i18n";
import { parseNumberOrZero } from "@/lib/number-input";
import { cn } from "@/lib/utils";

const METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank Transfer", "Cheque", "Other"];

function feeLineOrder(title: string): number {
  const index = FEE_HEADS.indexOf(feeHeadName(title) as (typeof FEE_HEADS)[number]);
  return index === -1 ? FEE_HEADS.length : index;
}

type PaymentRow = {
  _id?: string;
  amount: number;
  method: string;
  refNo?: string;
  receiptNo?: string;
  date?: string;
  note?: string;
  particular?: string;
};

type StudentRef = {
  _id?: string;
  name?: string;
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
  studentId?: StudentRef;
  payments?: PaymentRow[];
};

type TxGroup = {
  key: string;
  ledger: LedgerRow;
  payment: PaymentRow;
  lines: Array<{ title: string; amount: number }>;
  amount: number;
};

type SavedReceipt = {
  receiptNo: string;
  method: string;
  refNo: string;
  date: string;
  academicYear: string;
  student: { name: string; studentId: string; className: string };
  lines: Array<{ ledgerId: string; title: string; amount: number }>;
};

function remaining(row: LedgerRow): number {
  return Math.max(row.dueAmount - (row.discount ?? 0) - row.paidAmount, 0);
}

function money(n?: number) {
  return Number(n ?? 0).toLocaleString();
}

function classNameOf(student?: StudentRef): string | undefined {
  const value = student?.classId;
  if (value && typeof value === "object" && value.name) return value.name;
  return undefined;
}

function legacyReceiptNo(payment: PaymentRow, ledgerId: string): string {
  const ymd = payment.date
    ? new Date(payment.date).toISOString().slice(0, 10).replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `FEE-${ymd}-${(payment._id || ledgerId).slice(-6).toUpperCase()}`;
}

export default function FeeCollectedPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const { data: summary } = useGetFeeSummaryQuery();
  const { data, isLoading, isError, refetch } = useGetLedgersQuery();
  const [recordPayments, { isLoading: saving }] = useRecordFeePaymentsMutation();
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [periods, setPeriods] = useState<Record<string, string>>({});
  const [extraAmounts, setExtraAmounts] = useState<Record<string, string>>({});
  const [method, setMethod] = useState("Cash");
  const [refNo, setRefNo] = useState("");
  const [q, setQ] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [preview, setPreview] = useState<FeeReceiptData | null>(null);
  const [printQueued, setPrintQueued] = useState(false);
  const receiptAnchor = useRef<HTMLDivElement | null>(null);

  const allRows = (data?.data ?? []) as LedgerRow[];
  const openLedgers = allRows.filter((row) => remaining(row) > 0);
  const collectedRows = allRows.filter((row) => row.paidAmount > 0);
  const settings = session?.data.settings;

  const studentLookup = studentQuery.trim();
  const { data: studentSearch } = useGetStudentsQuery(
    { status: "active", q: studentLookup },
    { skip: studentLookup.length < 1 || Boolean(selectedStudentId) }
  );

  const heads = openLedgers.filter((row) => row.studentId?._id === selectedStudentId);

  const groups = useMemo(() => {
    const items: Array<{ key: string; ledger: LedgerRow; payment: PaymentRow }> = [];
    for (const ledger of collectedRows) {
      (ledger.payments ?? []).forEach((payment, index) => {
        items.push({
          key: `${ledger._id}-${payment._id ?? `${index}-${payment.date ?? ""}-${payment.amount}`}`,
          ledger,
          payment,
        });
      });
    }
    items.sort((a, b) => {
      const da = a.payment.date ? new Date(a.payment.date).getTime() : 0;
      const db = b.payment.date ? new Date(b.payment.date).getTime() : 0;
      return db - da;
    });
    const map = new Map<string, TxGroup>();
    const order: string[] = [];
    for (const item of items) {
      const receipt = item.payment.receiptNo?.trim();
      const student = item.ledger.studentId?._id ?? item.ledger._id;
      const groupKey = receipt ? `${student}:${receipt}` : item.key;
      let group = map.get(groupKey);
      if (!group) {
        group = { key: groupKey, ledger: item.ledger, payment: item.payment, lines: [], amount: 0 };
        map.set(groupKey, group);
        order.push(groupKey);
      }
      group.lines.push({
        title: item.payment.particular?.trim() || item.ledger.title,
        amount: item.payment.amount,
      });
      group.amount += item.payment.amount;
    }
    for (const group of map.values()) {
      group.lines.sort((a, b) => feeLineOrder(a.title) - feeLineOrder(b.title));
    }
    return order.map((key) => map.get(key)!);
  }, [collectedRows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return groups.filter((row) => {
      if (methodFilter && row.payment.method !== methodFilter) return false;
      if (!query) return true;
      const name = row.ledger.studentId?.name?.toLowerCase() ?? "";
      const sid = row.ledger.studentId?.studentId?.toLowerCase() ?? "";
      const titles = row.lines.map((line) => line.title.toLowerCase()).join(" ");
      return (
        name.includes(query) ||
        sid.includes(query) ||
        titles.includes(query) ||
        (row.payment.refNo ?? "").toLowerCase().includes(query) ||
        (row.payment.receiptNo ?? "").toLowerCase().includes(query)
      );
    });
  }, [groups, q, methodFilter]);

  const studentHits = ((studentSearch?.data ?? []) as Array<{ _id: string; name: string; studentId: string }>).slice(0, 40);
  const extraLedgers = heads.filter((row) => !FEE_HEADS.some((head) => feeTitleMatchesHead(row.title, head)));

  function catalogBalance(head: string, printed: string, amount: number): number | null {
    const candidates = heads.filter((row) => feeTitleMatchesHead(row.title, head));
    if (!candidates.length) return null;
    const fits = (row: LedgerRow) => amount > 0 && remaining(row) >= amount;
    const exact = candidates.find((row) => row.title.trim() === printed && fits(row));
    const bare = candidates.find((row) => row.title.trim() === head && fits(row));
    const any = [...candidates].filter(fits).sort((a, b) => remaining(b) - remaining(a))[0];
    if (exact || bare || any) return remaining((exact ?? bare ?? any)!);
    return Math.max(...candidates.map((row) => remaining(row)));
  }

  const catalogLines: Array<{ title: string; amount: number; over: boolean; balance: number | null; ledgerId?: string }> = FEE_HEADS.flatMap((head) => {
    const raw = (amounts[head] ?? "").trim();
    if (!raw) return [];
    const amount = parseNumberOrZero(raw);
    if (amount <= 0) return [];
    const title = feeParticular(head, periods[head] ?? defaultFeePeriod());
    const balance = catalogBalance(head, title, amount);
    return [{ title, amount, over: balance != null && amount > balance, balance }];
  });
  const extraLines = extraLedgers.flatMap((row) => {
    const raw = (extraAmounts[row._id] ?? "").trim();
    if (!raw) return [];
    const amount = parseNumberOrZero(raw);
    if (amount <= 0) return [];
    return [{ ledgerId: row._id, title: row.title, amount, over: amount > remaining(row), balance: remaining(row) }];
  });
  const chargeLines = [...catalogLines, ...extraLines];
  const hasOver = chargeLines.some((line) => line.over);
  const receiptTotal = chargeLines.reduce((sum, line) => sum + (line.over ? 0 : line.amount), 0);
  const canSubmit = Boolean(selectedStudentId) && chargeLines.length > 0 && !hasOver && !saving;

  function chooseStudent(student: { _id: string; name: string; studentId: string }) {
    setSelectedStudentId(student._id);
    setAmounts({});
    setExtraAmounts({});
    setPeriods(Object.fromEntries(FEE_HEADS.map((head) => [head, defaultFeePeriod()])));
    setStudentQuery([student.name, student.studentId].filter(Boolean).join(" · ") || student.name);
  }

  useEffect(() => {
    if (!preview || !printQueued) return;
    const id = window.setTimeout(() => {
      window.print();
      setPrintQueued(false);
    }, 200);
    return () => window.clearTimeout(id);
  }, [preview, printQueued]);

  useEffect(() => {
    if (!preview) return;
    const scroll = () => {
      const el = receiptAnchor.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (Math.abs(top - 80) < 24) return;
      el.scrollIntoView({ behavior: "auto", block: "start" });
    };
    scroll();
    const frame = window.requestAnimationFrame(scroll);
    return () => window.cancelAnimationFrame(frame);
  }, [preview, data]);

  function previewFromGroup(group: TxGroup): FeeReceiptData {
    const stored = group.payment.receiptNo?.trim();
    return {
      receiptNo: stored || legacyReceiptNo(group.payment, group.ledger._id),
      lines: group.lines,
      method: group.payment.method,
      refNo: group.payment.refNo,
      date: group.payment.date,
      note: group.payment.note,
      studentName: group.ledger.studentId?.name,
      studentId: group.ledger.studentId?.studentId,
      className: classNameOf(group.ledger.studentId),
      academicYear: group.ledger.academicYear,
    };
  }

  function openReceipt(group: TxGroup, andPrint = false) {
    setPreview(previewFromGroup(group));
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
          <StatCard label={t.fees.transactions} value={groups.length} />
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
            if (!selectedStudentId) return;
            if (!chargeLines.length) {
              toast.error(t.fees.amountRequired);
              return;
            }
            if (hasOver) {
              toast.error(t.fees.exceedsBalance);
              return;
            }
            const result = await recordPayments({
              studentId: selectedStudentId,
              method,
              refNo: refNo.trim() || undefined,
              lines: chargeLines.map((line) => ({
                ...(line.ledgerId ? { ledgerId: line.ledgerId } : {}),
                title: line.title,
                amount: line.amount,
              })),
            });
            if (toastApiResult(result, t.fees.recordPay, t.common.loadError)) {
              const saved = (result as { data?: { data?: SavedReceipt } }).data?.data;
              if (saved) {
                setPreview({
                  receiptNo: saved.receiptNo,
                  lines: saved.lines.map((line) => ({ title: line.title, amount: line.amount })),
                  method: saved.method,
                  refNo: saved.refNo,
                  date: saved.date,
                  studentName: saved.student.name,
                  studentId: saved.student.studentId,
                  className: saved.student.className,
                  academicYear: saved.academicYear,
                });
              }
              setAmounts({});
              setExtraAmounts({});
              setPeriods({});
              setSelectedStudentId("");
              setStudentQuery("");
              setRefNo("");
              setMethod("Cash");
            }
          }}
        >
          <Field label={t.common.student}>
            <Input
              value={studentQuery}
              onChange={(e) => {
                setStudentQuery(e.target.value);
                if (selectedStudentId) {
                  setSelectedStudentId("");
                  setAmounts({});
                  setExtraAmounts({});
                  setPeriods({});
                }
              }}
              placeholder={t.fees.searchStudent}
              autoComplete="off"
            />
            {!selectedStudentId && studentLookup ? (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border">
                {studentHits.length ? (
                  studentHits.map((student) => (
                    <li key={student._id}>
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                        onClick={() => chooseStudent(student)}
                      >
                        <span className="truncate">{student.name || "—"}</span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">{student.studentId || "—"}</span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-muted-foreground">{t.fees.noMatch}</li>
                )}
              </ul>
            ) : null}
          </Field>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t.fees.payHeads}</p>
            {selectedStudentId ? (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[40rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="w-12 px-3 py-2">{t.fees.slNo}</th>
                      <th className="px-3 py-2">{t.fees.particular}</th>
                      <th className="w-36 px-3 py-2">{t.fees.period}</th>
                      <th className="w-36 px-3 py-2 text-right">{t.fees.taka}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEE_HEADS.map((head, index) => {
                      const period = periods[head] ?? defaultFeePeriod();
                      const title = feeParticular(head, period);
                      const typed = parseNumberOrZero(amounts[head] ?? "");
                      const balance = catalogBalance(head, title, typed);
                      const over = typed > 0 && balance != null && typed > balance;
                      const included = typed > 0 && !over;
                      return (
                        <tr key={head} className={cn("border-b border-border last:border-b-0", included && "bg-emerald-50/70")}>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">{index + 1}</td>
                          <td className="px-3 py-2">
                            <p className="font-medium">{head}</p>
                            {balance != null ? (
                              <p className="text-xs text-muted-foreground">
                                {t.fees.remaining} ৳ {money(balance)}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={period}
                              aria-label={`${head} ${t.fees.period}`}
                              onChange={(e) => setPeriods((prev) => ({ ...prev, [head]: e.target.value }))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              value={amounts[head] ?? ""}
                              aria-label={`${head} ${t.fees.taka}`}
                              aria-invalid={over}
                              className={cn("text-right", over && "border-red-500")}
                              onChange={(e) => setAmounts((prev) => ({ ...prev, [head]: e.target.value }))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-foreground font-semibold">
                      <td className="px-3 py-2" colSpan={3}>
                        {t.fees.grandTotal}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">৳ {money(receiptTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
                {t.fees.searchStudent}
              </p>
            )}
            {selectedStudentId && extraLedgers.length ? (
              <div className="overflow-hidden rounded-md border border-border">
                {extraLedgers.map((row) => {
                  const balance = remaining(row);
                  const typed = parseNumberOrZero(extraAmounts[row._id] ?? "");
                  const over = typed > balance;
                  return (
                    <div
                      key={row._id}
                      className="grid items-center gap-2 border-b border-border px-3 py-2 last:border-b-0 sm:grid-cols-[1fr_auto_8rem]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.fees.remaining} ৳ {money(balance)}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={balance}
                        step="1"
                        value={extraAmounts[row._id] ?? ""}
                        aria-invalid={over}
                        className={cn(over && "border-red-500")}
                        onChange={(e) => setExtraAmounts((prev) => ({ ...prev, [row._id]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
              {hasOver ? <p className="text-sm text-red-600">{t.fees.exceedsBalance}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.fees.method}>
                  <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                    {METHODS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={t.fees.ref}>
                  <Input value={refNo} onChange={(e) => setRefNo(e.target.value)} />
                </Field>
              </div>
            </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit}>
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
            {METHODS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </div>

        {isLoading ? <TableSkeleton /> : null}
        {isError ? <QueryError onRetry={refetch} /> : null}
        {!isLoading && !filtered.length ? <EmptyState title={t.fees.emptyCollected} /> : null}

        <DataTable
          rows={filtered}
          rowKey={(row) => row.key}
          mobileCard={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{row.ledger.studentId?.name ?? "—"}</p>
                  <p className="font-mono text-xs text-muted-foreground">{row.ledger.studentId?.studentId ?? "—"}</p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{money(row.amount)}</p>
              </div>
              <p className="break-words text-sm">{row.lines.map((line) => line.title).join(", ")}</p>
              <p className="text-xs text-muted-foreground">
                {row.payment.date ? new Date(row.payment.date).toLocaleDateString() : "—"} · {row.payment.method}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" variant="secondary" onClick={() => openReceipt(row)}>
                  {t.common.view}
                </Button>
                <Button type="button" variant="secondary" onClick={() => openReceipt(row, true)}>
                  <Download size={14} className="mr-1" />
                  {t.fees.downloadReceipt}
                </Button>
              </div>
            </div>
          )}
          columns={[
            {
              header: t.common.student,
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.ledger.studentId?.name ?? "—"}</p>
                  {row.ledger.studentId?.studentId ? (
                    <p className="font-mono text-xs text-muted-foreground">{row.ledger.studentId.studentId}</p>
                  ) : null}
                </div>
              ),
            },
            {
              header: t.fees.studentId,
              cell: (row) => <span className="font-mono text-sm">{row.ledger.studentId?.studentId ?? "—"}</span>,
            },
            {
              header: t.fees.particular,
              cell: (row) => row.lines.map((line) => line.title).join(", "),
            },
            {
              header: t.common.date,
              cell: (row) => (row.payment.date ? new Date(row.payment.date).toLocaleDateString() : "—"),
            },
            { header: t.fees.method, cell: (row) => row.payment.method },
            {
              header: t.fees.amount,
              cell: (row) => money(row.amount),
              align: "right",
            },
            {
              header: t.common.actions,
              cell: (row) => (
                <div className="flex flex-wrap gap-1">
                  <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => openReceipt(row)}>
                    {t.common.view}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 px-2"
                    onClick={() => openReceipt(row, true)}
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
        <div ref={receiptAnchor} className="mt-8 scroll-mt-20">
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
