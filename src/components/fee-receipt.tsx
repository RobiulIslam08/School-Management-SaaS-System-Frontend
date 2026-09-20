"use client";

import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export type FeeReceiptPayment = {
  amount: number;
  method: string;
  refNo?: string;
  date?: string;
  note?: string;
  _id?: string;
};

export type FeeReceiptData = {
  payment: FeeReceiptPayment;
  title: string;
  studentName?: string;
  studentId?: string;
  academicYear?: string;
  dueAmount?: number;
  paidAmount?: number;
  ledgerId: string;
};

function money(n: number, locale: string) {
  return n.toLocaleString(locale === "bn" ? "bn-BD" : "en-BD");
}

export function FeeReceipt({
  item,
  settings,
}: {
  item: FeeReceiptData;
  settings?: Partial<SchoolSettings> | null;
}) {
  const { t, locale } = useI18n();
  const schoolName = settings?.name?.trim() || "School";
  const logoUrl = settings?.logoUrl?.trim() || "";
  const paidDate = item.payment.date
    ? new Date(item.payment.date).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const ymd = item.payment.date
    ? new Date(item.payment.date).toISOString().slice(0, 10).replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const receiptNo = `FEE-${ymd}-${(item.payment._id || item.ledgerId).slice(-6).toUpperCase()}`;

  return (
    <article className="fee-receipt-sheet mx-auto max-w-[210mm] overflow-hidden bg-white shadow-[0_8px_30px_rgba(28,25,23,0.08)] print:max-w-none print:shadow-none">
      <div className="border border-foreground/70">
        <header className="flex items-start gap-4 border-b border-foreground/30 px-8 py-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-foreground">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-xl font-bold">{schoolName.slice(0, 1)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold uppercase tracking-wide">{schoolName}</h1>
            {settings?.address ? <p className="mt-1 text-sm text-muted-foreground">{settings.address}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.fees.receipt}</p>
            <p className="mt-1 text-lg font-bold">{t.fees.moneyReceipt}</p>
            <p className="mt-2 font-mono text-xs">{receiptNo}</p>
          </div>
        </header>
        <div className="grid gap-4 border-b border-foreground/20 px-8 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.common.student}</p>
            <p className="mt-1 text-base font-semibold">{item.studentName ?? "—"}</p>
            {item.studentId ? <p className="text-muted-foreground">{item.studentId}</p> : null}
          </div>
          <div className="sm:text-right">
            <p>
              <span className="text-muted-foreground">{t.fees.receiptNo}: </span>
              <span className="font-mono font-medium">{receiptNo}</span>
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">{t.common.date}: </span>
              {paidDate}
            </p>
            {item.academicYear ? (
              <p className="mt-1">
                <span className="text-muted-foreground">{t.common.year}: </span>
                {item.academicYear}
              </p>
            ) : null}
          </div>
        </div>
        <div className="px-8 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2">{t.fees.titleField}</th>
                <th className="pb-2">{t.fees.method}</th>
                <th className="pb-2 text-right">{t.fees.amount} (BDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 font-medium">{item.title}</td>
                <td className="py-3">
                  {item.payment.method}
                  {item.payment.refNo ? ` · ${item.payment.refNo}` : ""}
                </td>
                <td className="py-3 text-right tabular-nums font-semibold">{money(item.payment.amount, locale)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-6 ml-auto flex max-w-xs items-center justify-between rounded-md bg-foreground px-3 py-3 text-background">
            <span className="font-semibold">{t.fees.received}</span>
            <span className="text-lg font-bold tabular-nums">BDT {money(item.payment.amount, locale)}</span>
          </div>
          {item.payment.note ? <p className="mt-4 text-sm text-muted-foreground">{item.payment.note}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-10 px-8 pb-8 pt-10 text-center text-xs">
          <div>
            <div className="mx-auto mb-2 h-12 max-w-[11rem] border-b border-foreground" />
            <p className="font-medium">{t.staff.accountant}</p>
          </div>
          <div>
            <div className="mx-auto mb-2 h-12 max-w-[11rem] border-b border-foreground" />
            <p className="font-medium">{t.common.guardian}</p>
          </div>
        </div>
        <footer className="border-t border-foreground/20 bg-muted/30 px-8 py-3 text-center text-[11px] text-muted-foreground">
          {t.fees.receiptFooter}
        </footer>
      </div>
    </article>
  );
}
