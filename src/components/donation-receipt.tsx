"use client";

import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export type DonationReceiptData = {
  _id: string;
  receiptNo?: string;
  date?: string;
  amount: number;
  donorName: string;
  donorPhone?: string;
  donorAddress?: string;
  purpose?: string;
  method?: string;
  refNo?: string;
  note?: string;
  academicYear?: string;
};

function money(n: number, locale: string) {
  return n.toLocaleString(locale === "bn" ? "bn-BD" : "en-BD");
}

export function DonationReceipt({
  item,
  settings,
}: {
  item: DonationReceiptData;
  settings?: Partial<SchoolSettings> | null;
}) {
  const { t, locale } = useI18n();
  const schoolName = settings?.name?.trim() || "School";
  const logoUrl = settings?.logoUrl?.trim() || "";
  const issued = item.date
    ? new Date(item.date).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <article className="donation-receipt-sheet mx-auto max-w-[210mm] overflow-hidden bg-white shadow-[0_8px_30px_rgba(28,25,23,0.08)] print:max-w-none print:shadow-none">
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.donations.receipt}</p>
            <p className="mt-1 text-lg font-bold">{t.donations.receiptTitle}</p>
            <p className="mt-2 font-mono text-xs">{item.receiptNo || item._id.slice(-8).toUpperCase()}</p>
          </div>
        </header>
        <div className="grid gap-4 border-b border-foreground/20 px-8 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.donations.donor}</p>
            <p className="mt-1 text-base font-semibold">{item.donorName}</p>
            {item.donorPhone ? <p className="text-muted-foreground">{item.donorPhone}</p> : null}
            {item.donorAddress ? <p className="mt-1 text-muted-foreground">{item.donorAddress}</p> : null}
          </div>
          <div className="sm:text-right">
            <p>
              <span className="text-muted-foreground">{t.common.date}: </span>
              {issued}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">{t.fees.method}: </span>
              {item.method || "Cash"}
              {item.refNo ? ` · ${item.refNo}` : ""}
            </p>
            {item.purpose ? (
              <p className="mt-1">
                <span className="text-muted-foreground">{t.donations.purpose}: </span>
                {item.purpose}
              </p>
            ) : null}
          </div>
        </div>
        <div className="px-8 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t.donations.thanks}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">BDT {money(item.amount, locale)}</p>
          {item.note ? <p className="mt-4 text-sm text-muted-foreground">{item.note}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-10 px-8 pb-8 pt-4 text-center text-xs">
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
          {t.donations.receiptFooter}
        </footer>
      </div>
    </article>
  );
}
