"use client";

import { amountInWords } from "@/lib/amount-words";
import { useI18n } from "@/lib/i18n";
import type { SchoolSettings } from "@/lib/types";

export type FeeReceiptLine = {
  title: string;
  amount: number;
};

export type FeeReceiptData = {
  receiptNo: string;
  lines: FeeReceiptLine[];
  method: string;
  refNo?: string;
  date?: string;
  note?: string;
  studentName?: string;
  studentId?: string;
  className?: string;
  academicYear?: string;
};

const STAMP_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function money(n: number, locale: string) {
  return n.toLocaleString(locale === "bn" ? "bn-BD" : "en-BD");
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function stampDate(value?: string): string {
  const date = parseDate(value);
  if (!date) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${STAMP_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
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
  const paid = parseDate(item.date);
  const paidDate = paid
    ? paid.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const lines = item.lines.filter((line) => line.amount > 0);
  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return (
    <article className="fee-receipt-sheet mx-auto max-w-[210mm] bg-white text-foreground shadow-[0_8px_30px_rgba(28,25,23,0.08)] print:max-w-none print:text-[11px] print:shadow-none">
      <div className="border-[3px] border-foreground p-1 print:p-0.5">
        <div className="border border-foreground px-3 py-3 sm:px-5 print:px-3 print:py-1.5">
          <header className="grid grid-cols-1 items-center gap-2 border-b-2 border-foreground pb-2 sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:gap-3 print:gap-2 print:pb-1.5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-foreground sm:mx-0 print:h-11 print:w-11">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-xl font-bold">{schoolName.slice(0, 1)}</span>
              )}
            </div>
            <div className="min-w-0 text-center">
              {settings?.motto ? <p className="text-[11px] italic text-muted-foreground">{settings.motto}</p> : null}
              <h1 className="break-words text-base font-extrabold uppercase leading-tight tracking-wide sm:text-lg print:text-base">{schoolName}</h1>
              {settings?.address ? <p className="mt-0.5 text-xs">{settings.address}</p> : null}
              <p className="mt-0.5 text-[11px]">
                {settings?.eiin ? `${t.marksheets.eiin}: ${settings.eiin}` : null}
                {settings?.eiin && settings?.academicYear ? "  ·  " : null}
                {settings?.academicYear ? `${t.common.year}: ${settings.academicYear}` : null}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.fees.receipt}</p>
              <p className="mt-0.5 text-sm font-bold print:text-xs">{t.fees.moneyReceipt}</p>
            </div>
          </header>

          <div className="mt-2 grid gap-x-6 gap-y-0.5 text-sm print:mt-1.5 print:text-[11px] sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">{t.common.student}: </span>
              <span className="font-semibold">{item.studentName || "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{t.fees.studentId}: </span>
              <span className="font-mono">{item.studentId || "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{t.common.class}: </span>
              {item.className || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">{t.common.date}: </span>
              {paidDate}
            </p>
            <p>
              <span className="text-muted-foreground">{t.fees.receiptNo}: </span>
              <span className="font-mono font-medium">{item.receiptNo}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{t.fees.method}: </span>
              {item.method}
              {item.refNo ? ` · ${item.refNo}` : ""}
            </p>
            {item.academicYear ? (
              <p>
                <span className="text-muted-foreground">{t.common.year}: </span>
                {item.academicYear}
              </p>
            ) : null}
          </div>

          <table className="mt-3 w-full border-collapse text-sm print:mt-2 print:text-[11px]">
            <thead>
              <tr className="border-y-2 border-foreground text-left text-xs uppercase tracking-wider">
                <th className="w-10 py-1 print:py-0.5">{t.fees.slNo}</th>
                <th className="py-1 print:py-0.5">{t.fees.particular}</th>
                <th className="w-24 py-1 text-right print:py-0.5">{t.fees.taka}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={`${line.title}-${index}`} className="border-b border-foreground/20">
                  <td className="py-1 tabular-nums print:py-px">{index + 1}</td>
                  <td className="py-1 font-medium print:py-px">{line.title}</td>
                  <td className="py-1 text-right tabular-nums print:py-px">{money(line.amount, locale)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground font-bold">
                <td className="py-1 print:py-0.5" colSpan={2}>
                  {t.fees.grandTotal}
                </td>
                <td className="py-1 text-right tabular-nums print:py-0.5">{money(total, locale)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:mt-2 print:flex-row print:items-start print:justify-between print:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug print:text-[11px]">
                <span className="font-semibold">{t.fees.inWords}: </span>
                {amountInWords(total, locale)}
              </p>
              {item.note ? <p className="mt-1 text-sm text-muted-foreground print:text-[11px]">{item.note}</p> : null}
            </div>
            <div className="self-end sm:self-start print:self-start">
              <div className="inline-block -rotate-6 border-[3px] border-blue-800 px-2.5 py-1 text-center text-blue-800 print:px-2 print:py-0.5">
                <p className="text-xs font-black uppercase tracking-[0.22em] print:text-[10px]">{t.fees.receivedMark}</p>
                <p className="text-[11px] font-bold print:text-[10px]">{stampDate(item.date)}</p>
                <p className="mx-auto mt-0.5 max-w-[8.5rem] text-[9px] font-semibold leading-tight">{schoolName}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 text-center text-xs print:mt-3 print:gap-6 sm:gap-8">
            <div>
              <div className="mx-auto mb-1 h-7 max-w-[11rem] border-b border-foreground print:h-5" />
              <p className="font-semibold">{t.staff.accountant}</p>
            </div>
            <div>
              <div className="mx-auto mb-1 h-7 max-w-[11rem] border-b border-foreground print:h-5" />
              <p className="font-semibold">{t.fees.payerSign}</p>
            </div>
          </div>

          <footer className="mt-3 border-t border-foreground/20 pt-1.5 text-center text-[11px] text-muted-foreground print:mt-2 print:pt-1">
            {t.fees.receiptFooter}
          </footer>
        </div>
      </div>
    </article>
  );
}
