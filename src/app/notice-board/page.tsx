"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pin, Printer } from "lucide-react";
import { NoticeDocument } from "@/components/notice-document";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button } from "@/components/ui";
import { useGetBrandingQuery, useGetPublicNoticesQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import type { SchoolSettings } from "@/lib/types";

type PublicNotice = {
  _id: string;
  title: string;
  body: string;
  refNo?: string;
  issueDate?: string;
  createdAt?: string;
  category?: string;
  signatories?: Array<{ name?: string; designation?: string }>;
  pinned?: boolean;
  createdByName?: string;
};

export default function PublicNoticeBoardPage() {
  const { t, locale } = useI18n();
  const { data, isLoading, isError, refetch } = useGetPublicNoticesQuery();
  const { data: brandingData } = useGetBrandingQuery();
  const [selected, setSelected] = useState<PublicNotice | null>(null);

  const notices = (data?.data ?? []) as PublicNotice[];
  const branding = brandingData?.data as Partial<SchoolSettings> & { name?: string } | undefined;
  const settings = useMemo(
    () =>
      ({
        name: branding?.name ?? "School",
        logoUrl: String(branding?.logoUrl ?? ""),
        address: String(branding?.address ?? ""),
        eiin: String(branding?.eiin ?? ""),
        establishedYear: (branding?.establishedYear as number | null) ?? null,
        motto: String(branding?.motto ?? ""),
        academicYear: String(branding?.academicYear ?? ""),
        theme: { primary: "#0f766e", radius: "0.75rem" },
        defaultLanguage: "bn" as const,
      }) satisfies SchoolSettings,
    [branding]
  );

  return (
    <div className="notices-page min-h-screen bg-canvas">
      <div className="no-print mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {settings.name}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{t.notices.boardTitle}</h1>
            <p className="mt-1 text-muted-foreground">{t.notices.boardSubtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-medium"
            >
              {locale === "bn" ? "হোম" : "Home"}
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              {t.auth.signIn}
            </Link>
          </div>
        </div>

        {isLoading ? <TableSkeleton /> : null}
        {isError ? <QueryError onRetry={refetch} /> : null}
        {!isLoading && !notices.length ? <EmptyState title={t.notices.boardEmpty} /> : null}

        <ul className="space-y-3">
          {notices.map((item) => (
            <li key={item._id}>
              <button
                type="button"
                className="w-full rounded-xl border border-border bg-white p-5 text-left shadow-sm transition hover:border-primary/40"
                onClick={() => setSelected(item)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {item.pinned ? <Pin size={14} className="text-primary" /> : null}
                  <span className="font-semibold">{item.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.refNo ? `${item.refNo} · ` : ""}
                  {new Date(item.issueDate || item.createdAt || Date.now()).toLocaleDateString(
                    locale === "bn" ? "bn-BD" : "en-GB"
                  )}
                </p>
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selected ? (
        <div className="mx-auto max-w-[210mm] px-4 pb-16">
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t.notices.preview}</h2>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                <Printer size={16} className="mr-1.5" />
                {t.notices.printPdf}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                {t.common.close}
              </Button>
            </div>
          </div>
          <NoticeDocument
            item={{
              title: selected.title,
              body: selected.body,
              refNo: selected.refNo,
              issueDate: selected.issueDate || selected.createdAt,
              category: selected.category,
              signatories: selected.signatories,
              createdByName: selected.createdByName,
            }}
            settings={settings}
          />
        </div>
      ) : null}
    </div>
  );
}
