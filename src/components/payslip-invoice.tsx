"use client";

import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export type PayslipInvoiceData = {
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

function money(n?: number, locale?: string) {
  return Number(n ?? 0).toLocaleString(locale === "bn" ? "bn-BD" : "en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function invoiceNo(item: PayslipInvoiceData) {
  const month = (item.month || "").replace("-", "");
  const short = item._id.slice(-6).toUpperCase();
  return `PAY-${month || "000000"}-${short}`;
}

function formatMonth(month: string, locale: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function PayslipInvoice({
  item,
  settings,
}: {
  item: PayslipInvoiceData;
  settings?: Partial<SchoolSettings> | null;
}) {
  const { t, locale } = useI18n();
  const schoolName = settings?.name?.trim() || "School";
  const logoUrl = settings?.logoUrl?.trim() || "";
  const issued = new Date(item.paidAt || item.createdAt || Date.now()).toLocaleDateString(
    locale === "bn" ? "bn-BD" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );
  const gross = Number(item.basic ?? 0) + Number(item.allowances ?? 0);
  const rows = [
    { label: t.payroll.basic, amount: Number(item.basic ?? 0), tone: "credit" as const },
    { label: t.payroll.allowances, amount: Number(item.allowances ?? 0), tone: "credit" as const },
    { label: t.payroll.advance, amount: Number(item.advance ?? 0), tone: "debit" as const },
    { label: t.payroll.deduction, amount: Number(item.deduction ?? 0), tone: "debit" as const },
  ];

  return (
    <article className="payslip-sheet mx-auto max-w-[210mm] overflow-hidden bg-white text-foreground shadow-[0_8px_30px_rgba(28,25,23,0.08)] print:max-w-none print:shadow-none">
      <div className="border border-foreground/70">
        <header className="border-b border-foreground/30 px-8 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-foreground bg-white">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-xl font-bold">{schoolName.slice(0, 1)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold uppercase tracking-wide">{schoolName}</h1>
              {settings?.address ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{settings.address}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {settings?.eiin ? `${t.marksheets.eiin}: ${settings.eiin}` : null}
                {settings?.academicYear ? ` · ${t.common.year}: ${settings.academicYear}` : null}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t.payroll.invoice}
              </p>
              <p className="mt-1 text-lg font-bold">{t.payroll.payslipTitle}</p>
              <p className="mt-2 font-mono text-xs">{invoiceNo(item)}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 border-b border-foreground/20 px-8 py-5 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.payroll.billTo}
            </p>
            <p className="mt-1 text-base font-semibold">{item.teacherId?.name ?? "—"}</p>
            {item.teacherId?.staffId ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t.payroll.staffId}: {item.teacherId.staffId}
              </p>
            ) : null}
          </div>
          <div className="text-sm sm:text-right">
            <p>
              <span className="text-muted-foreground">{t.payroll.invoiceNo}: </span>
              <span className="font-mono font-medium">{invoiceNo(item)}</span>
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">{t.payroll.month}: </span>
              <span className="font-medium">{formatMonth(item.month, locale)}</span>
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">{t.payroll.invoiceDate}: </span>
              <span className="font-medium">{issued}</span>
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">{t.common.status}: </span>
              <span className="font-semibold">
                {item.status === "paid" ? t.fees.paid : t.payroll.draft}
              </span>
            </p>
          </div>
        </div>

        <div className="px-8 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-semibold">#</th>
                <th className="pb-2 font-semibold">{t.payroll.particulars}</th>
                <th className="pb-2 text-right font-semibold">{t.payroll.amount} (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.label} className="border-b border-border">
                  <td className="py-2.5 tabular-nums text-muted-foreground">{index + 1}</td>
                  <td className="py-2.5">{row.label}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {row.tone === "debit" ? "− " : ""}
                    {money(row.amount, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">{t.payroll.gross}</span>
              <span className="tabular-nums font-medium">{money(gross, locale)}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">{t.payroll.totalDeduction}</span>
              <span className="tabular-nums">
                − {money(Number(item.advance ?? 0) + Number(item.deduction ?? 0), locale)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-foreground px-3 py-3 text-background">
              <span className="font-semibold">{t.payroll.netPayable}</span>
              <span className="text-lg font-bold tabular-nums">BDT {money(item.net, locale)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 px-8 pb-8 pt-10 text-center text-xs">
          <div>
            <div className="mx-auto mb-2 h-12 max-w-[11rem] border-b border-foreground" />
            <p className="font-medium">{t.staff.accountant}</p>
          </div>
          <div>
            <div className="mx-auto mb-2 h-12 max-w-[11rem] border-b border-foreground" />
            <p className="font-medium">{t.marksheets.head}</p>
          </div>
        </div>

        <footer className="border-t border-foreground/20 bg-muted/30 px-8 py-3 text-center text-[11px] text-muted-foreground">
          {t.payroll.invoiceFooter}
        </footer>
      </div>
    </article>
  );
}
