"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Input } from "@/components/ui";
import { useGetTalentQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type TalentRow = {
  _id: string;
  count: number;
  students: Array<{ id?: string; _id?: string; name: string; studentId: string }>;
};

export default function TalentPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetTalentQuery();
  const [q, setQ] = useState("");
  const rows = (data?.data ?? []) as TalentRow[];
  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row._id.toLowerCase().includes(query) ||
        row.students.some((student) => student.name.toLowerCase().includes(query) || student.studentId.toLowerCase().includes(query))
    );
  }, [q, rows]);
  const tagged = rows.reduce((sum, row) => sum + row.count, 0);

  if (isLoading) return <TableSkeleton />;
  if (isError) return <QueryError onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={t.talent.title} subtitle={t.talent.subtitle} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label={t.common.tags} value={rows.length} icon={<Sparkles size={18} />} />
        <StatCard href="/students" label={t.reports.count} value={tagged} />
      </div>
      <Input className="mb-4 max-w-md" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.common.searchPlaceholder} />
      {!visible.length ? <EmptyState title={t.talent.empty} hint={t.talent.emptyHint} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((row) => (
            <article key={row._id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{row._id}</h3>
                <span className="text-sm tabular-nums text-muted-foreground">{row.count}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {row.students.map((student) => {
                  const id = student.id ?? student._id;
                  return (
                    <li key={`${row._id}-${student.studentId}`}>
                      {id ? (
                        <Link className="text-primary underline-offset-4 hover:underline" href={`/students/${id}`}>
                          {student.name}
                        </Link>
                      ) : (
                        student.name
                      )}
                      <span className="text-muted-foreground"> · {student.studentId}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
