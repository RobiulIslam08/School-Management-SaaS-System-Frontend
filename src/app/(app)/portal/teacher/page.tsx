"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, Printer } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { NoticeDocument } from "@/components/notice-document";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Card } from "@/components/ui";
import { useGetSettingsQuery, useTeacherPortalQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type SubjectRow = { _id?: string; name?: string; code?: string; classId?: { name?: string } };
type TeacherPayload = {
  name?: string;
  designation?: string;
  staffId?: string;
  photoUrl?: string;
  subjects?: SubjectRow[];
  classTeacherOf?: { section?: string; classId?: { name?: string } };
};
type NoticeRow = {
  _id: string;
  title: string;
  body?: string;
  refNo?: string;
  issueDate?: string;
  createdAt?: string;
  signatories?: Array<{ name?: string; designation?: string }>;
  createdByName?: string;
};

export default function TeacherPortalPage() {
  const { t, locale } = useI18n();
  const { data, isLoading, isError, refetch } = useTeacherPortalQuery();
  const { data: settingsData } = useGetSettingsQuery();
  const [viewNotice, setViewNotice] = useState<NoticeRow | null>(null);
  const notices = (data?.data?.notices ?? []) as NoticeRow[];
  const teacher = (data?.data?.teacher ?? null) as TeacherPayload | null;
  const subjects = teacher?.subjects ?? [];
  const settings = settingsData?.data;

  if (isLoading) return <TableSkeleton />;
  if (isError) return <QueryError onRetry={refetch} />;

  return (
    <div className="notices-page">
      <div className="no-print">
        <PageHeader
          title={t.portals.teacherTitle}
          subtitle={teacher ? `${teacher.name ?? ""} · ${teacher.designation ?? ""}` : t.portals.teacherHint}
        />
        {teacher ? (
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-lg font-semibold text-primary shadow-xs">
              {teacher.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={teacher.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{teacher.name?.slice(0, 1) || "T"}</span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{teacher.name}</h2>
              <p className="text-xs text-muted-foreground">
                {teacher.staffId} · {teacher.designation || "Teacher"}
              </p>
            </div>
          </div>
        ) : null}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <StatCard href="/attendance" label={t.portals.attendance} value={subjects.length} icon={<CalendarDays size={18} />} />
          <StatCard href="/results" label={t.portals.subjects} value={subjects.length} icon={<BookOpen size={18} />} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/attendance">
            <Button>{t.portals.attendance}</Button>
          </Link>
          <Link href="/results">
            <Button variant="secondary">{t.portals.marks}</Button>
          </Link>
          <Link href="/notices">
            <Button variant="secondary">{t.portals.notices}</Button>
          </Link>
        </div>
        {teacher?.classTeacherOf?.classId?.name ? (
          <Card className="mt-6">
            <h2 className="font-semibold">{t.classes.classTeacher}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {teacher.classTeacherOf.classId.name}
              {teacher.classTeacherOf.section ? ` · ${teacher.classTeacherOf.section}` : ""}
            </p>
          </Card>
        ) : null}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-semibold">{t.portals.subjects}</h2>
            {subjects.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {subjects.map((item, index) => (
                  <li key={item._id ?? String(index)} className="flex justify-between gap-3">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">{item.classId?.name ?? item.code ?? ""}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t.subjects.empty}</p>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold">{t.portals.notices}</h2>
            {notices.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {notices.map((item) => (
                  <li key={item._id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.issueDate || item.createdAt || Date.now()).toLocaleDateString(
                          locale === "bn" ? "bn-BD" : "en-GB"
                        )}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" className="h-8 shrink-0" onClick={() => setViewNotice(item)}>
                      {t.notices.view}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t.portals.noNotices} />
            )}
          </Card>
        </div>
      </div>

      <Dialog
        open={Boolean(viewNotice)}
        title={viewNotice?.title ?? t.notices.preview}
        onClose={() => setViewNotice(null)}
        className="max-w-3xl"
      >
        {viewNotice ? (
          <div>
            <div className="no-print mb-3 flex justify-end">
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                <Printer size={14} className="mr-1.5" />
                {t.notices.printPdf}
              </Button>
            </div>
            <NoticeDocument
              item={{
                title: viewNotice.title,
                body: viewNotice.body ?? "",
                refNo: viewNotice.refNo,
                issueDate: viewNotice.issueDate || viewNotice.createdAt,
                signatories: viewNotice.signatories,
                createdByName: viewNotice.createdByName,
              }}
              settings={settings}
            />
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
