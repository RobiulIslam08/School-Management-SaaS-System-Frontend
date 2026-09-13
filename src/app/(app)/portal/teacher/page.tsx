"use client";

import Link from "next/link";
import { BookOpen, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Card } from "@/components/ui";
import { useTeacherPortalQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type SubjectRow = { _id?: string; name?: string; code?: string; classId?: { name?: string } };
type TeacherPayload = {
  name?: string;
  designation?: string;
  staffId?: string;
  subjects?: SubjectRow[];
  classTeacherOf?: { section?: string; classId?: { name?: string } };
};

export default function TeacherPortalPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useTeacherPortalQuery();
  const notices = (data?.data?.notices ?? []) as Array<{ _id: string; title: string; body?: string }>;
  const teacher = (data?.data?.teacher ?? null) as TeacherPayload | null;
  const subjects = teacher?.subjects ?? [];

  if (isLoading) return <TableSkeleton />;
  if (isError) return <QueryError onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title={t.portals.teacherTitle}
        subtitle={teacher ? `${teacher.name ?? ""} · ${teacher.designation ?? ""}` : t.portals.teacherHint}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard href="/attendance" label={t.portals.attendance} value={subjects.length} icon={<CalendarDays size={18} />} />
        <StatCard href="/results" label={t.portals.subjects} value={subjects.length} icon={<BookOpen size={18} />} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/attendance"><Button>{t.portals.attendance}</Button></Link>
        <Link href="/results"><Button variant="secondary">{t.portals.marks}</Button></Link>
        <Link href="/notices"><Button variant="secondary">{t.portals.notices}</Button></Link>
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
            <ul className="mt-3 space-y-2 text-sm">
              {notices.map((item) => (
                <li key={item._id}>
                  <p className="font-medium">{item.title}</p>
                  {item.body ? <p className="text-muted-foreground">{item.body}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t.portals.noNotices} />
          )}
        </Card>
      </div>
    </div>
  );
}
