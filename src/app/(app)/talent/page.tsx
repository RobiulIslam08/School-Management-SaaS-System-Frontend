"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { Dialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Field, Input } from "@/components/ui";
import { useUpdateStudentMutation } from "@/lib/api/peopleApi";
import { useGetStudentsQuery, useGetTalentQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type TalentRow = {
  _id: string;
  count: number;
  students: Array<{ id?: string; _id?: string; name: string; studentId: string }>;
};

type StudentOption = {
  _id: string;
  name: string;
  studentId: string;
  talentTags?: string[];
};

function parseTags(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function mergeTags(existing: string[] | undefined, incoming: string[]): string[] {
  const set = new Set<string>();
  for (const tag of existing ?? []) {
    const t = tag.trim();
    if (t) set.add(t);
  }
  for (const tag of incoming) {
    set.add(tag);
  }
  return Array.from(set);
}

export default function TalentPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetTalentQuery();
  const { data: studentsData } = useGetStudentsQuery({ status: "active" });
  const [updateStudent] = useUpdateStudentMutation();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = (data?.data ?? []) as TalentRow[];
  const students = (studentsData?.data ?? []) as StudentOption[];
  const selected = students.find((s) => s._id === studentId);

  const studentMatches = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students.slice(0, 40);
    return students
      .filter(
        (row) =>
          row.name.toLowerCase().includes(query) || row.studentId.toLowerCase().includes(query)
      )
      .slice(0, 40);
  }, [students, studentSearch]);

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row._id.toLowerCase().includes(query) ||
        row.students.some(
          (student) =>
            student.name.toLowerCase().includes(query) || student.studentId.toLowerCase().includes(query)
        )
    );
  }, [q, rows]);
  const tagged = rows.reduce((sum, row) => sum + row.count, 0);

  if (isLoading) return <TableSkeleton />;
  if (isError) return <QueryError onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title={t.talent.title}
        subtitle={t.talent.subtitle}
        action={
          <Button
            onClick={() => {
              setStudentId("");
              setStudentSearch("");
              setTagsInput("");
              setOpen(true);
            }}
          >
            {t.talent.add}
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label={t.common.tags} value={rows.length} icon={<Sparkles size={18} />} />
        <StatCard href="/students" label={t.reports.count} value={tagged} />
      </div>
      <Input className="mb-4 max-w-md" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.common.searchPlaceholder} />
      {!visible.length ? (
        <EmptyState title={t.talent.empty} hint={t.talent.emptyHint} />
      ) : (
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

      <Dialog open={open} title={t.talent.add} onClose={() => setOpen(false)} className="max-w-lg">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!studentId) return;
            const incoming = parseTags(tagsInput);
            if (!incoming.length) return;
            setSaving(true);
            const talentTags = mergeTags(selected?.talentTags, incoming);
            const result = await updateStudent({ id: studentId, talentTags });
            setSaving(false);
            if (toastApiResult(result, t.common.save, t.common.loadError)) {
              setOpen(false);
              setStudentId("");
              setStudentSearch("");
              setTagsInput("");
            }
          }}
        >
          <p className="text-sm text-muted-foreground">{t.talent.addHint}</p>
          <Field label={t.common.student}>
            <Input
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value);
                if (studentId) setStudentId("");
              }}
              placeholder={t.talent.studentSearch}
              autoComplete="off"
            />
            {selected ? (
              <p className="mt-1.5 text-sm font-medium text-foreground">
                {selected.name} · {selected.studentId}
              </p>
            ) : null}
            <ul className="mt-2 max-h-44 overflow-y-auto rounded-md border border-border bg-white">
              {studentMatches.length ? (
                studentMatches.map((row) => (
                  <li key={row._id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50",
                        studentId === row._id && "bg-primary/10 font-medium"
                      )}
                      onClick={() => {
                        setStudentId(row._id);
                        setStudentSearch(`${row.name} · ${row.studentId}`);
                        setTagsInput((row.talentTags ?? []).join(", "));
                      }}
                    >
                      <span className="truncate">{row.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{row.studentId}</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-muted-foreground">{t.talent.noStudent}</li>
              )}
            </ul>
          </Field>
          <Field label={t.students.talentTags}>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={t.students.talentHint}
              required
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={saving || !studentId || !parseTags(tagsInput).length}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
