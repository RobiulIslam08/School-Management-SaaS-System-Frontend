"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MarksheetDocument, type MarksheetRow } from "@/components/marksheet-document";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select } from "@/components/ui";
import { useGetClassesQuery, useGetExamsQuery, useGetResultsQuery, useGetSubjectsQuery, useMeQuery } from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function readQuery() {
  if (typeof window === "undefined") return { exam: "", classId: "", section: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    exam: params.get("exam") ?? "",
    classId: params.get("class") ?? "",
    section: params.get("section") ?? "",
  };
}

export default function MarksheetsPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const { data: exams } = useGetExamsQuery();
  const [examTypeId, setExamTypeId] = useState("");
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [q, setQ] = useState("");
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: classes } = useGetClassesQuery();
  const { data: subjects } = useGetSubjectsQuery(classId || undefined);
  const { data, isLoading, isError, refetch } = useGetResultsQuery(
    examTypeId ? { examTypeId, classId, section } : undefined
  );
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const rows = (data?.data ?? []) as MarksheetRow[];
  const examList = (exams?.data ?? []) as Array<{ _id: string; name: string }>;
  const expectedSubjects = ((subjects?.data ?? []) as unknown[]).length;

  useEffect(() => {
    const query = readQuery();
    if (query.exam) setExamTypeId(query.exam);
    if (query.classId) setClassId(query.classId);
    if (query.section) setSection(query.section);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (onlyComplete && expectedSubjects > 0 && (row.subjectMarks?.length ?? 0) < expectedSubjects) {
        return false;
      }
      if (!query) return true;
      const name = row.studentId?.name?.toLowerCase() ?? "";
      const nameBn = row.studentId?.nameBn?.toLowerCase() ?? "";
      const sid = row.studentId?.studentId?.toLowerCase() ?? "";
      const roll = row.studentId?.rollNo?.toLowerCase() ?? "";
      return name.includes(query) || nameBn.includes(query) || sid.includes(query) || roll.includes(query);
    });
  }, [rows, q, onlyComplete, expectedSubjects]);

  const printRows = selectedId ? filtered.filter((row) => row._id === selectedId) : filtered;

  const exportHref = useMemo(() => {
    if (!examTypeId) return null;
    const search = new URLSearchParams();
    if (classId) search.set("classId", classId);
    if (section) search.set("section", section);
    const qs = search.toString();
    return `/api/v1/results/${examTypeId}/export${qs ? `?${qs}` : ""}`;
  }, [examTypeId, classId, section]);

  return (
    <div className="marksheets-page">
      <div className="no-print">
        <PageHeader
          title={t.marksheets.title}
          subtitle={t.marksheets.subtitle}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={!printRows.length} onClick={() => window.print()}>
                {t.common.print}
                {selectedId ? ` (1)` : printRows.length ? ` (${printRows.length})` : ""}
              </Button>
              {exportHref ? (
                <a
                  className="inline-flex h-11 items-center rounded-md border border-border bg-white px-4 text-sm"
                  href={exportHref}
                >
                  {t.common.excel}
                </a>
              ) : null}
            </div>
          }
        />
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label={t.marksheets.pickExam} htmlFor="ms-exam">
            <Select id="ms-exam" value={examTypeId} onChange={(e) => { setExamTypeId(e.target.value); setSelectedId(null); }}>
              <option value="">{t.marksheets.pickExam}</option>
              {examList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.common.class} htmlFor="ms-class">
            <Select
              id="ms-class"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSection(sectionNames(classList.find((item) => item._id === e.target.value)?.sections as never)[0] ?? "");
                setSelectedId(null);
              }}
            >
              <option value="">{t.common.all}</option>
              {classList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.common.section} htmlFor="ms-section">
            <Select id="ms-section" value={section} onChange={(e) => setSection(e.target.value)}>
              {sectionNames(classList.find((item) => item._id === classId)?.sections as never).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.common.search} htmlFor="ms-q">
            <Input id="ms-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.common.searchPlaceholder} />
          </Field>
          <Field label={t.marksheets.filterComplete} htmlFor="ms-complete">
            <Select
              id="ms-complete"
              value={onlyComplete ? "complete" : "all"}
              onChange={(e) => setOnlyComplete(e.target.value === "complete")}
            >
              <option value="all">{t.common.all}</option>
              <option value="complete">{t.marksheets.onlyComplete}</option>
            </Select>
          </Field>
        </div>
        {selectedId ? (
          <div className="mb-4">
            <Button type="button" variant="ghost" onClick={() => setSelectedId(null)}>
              {t.marksheets.clearSelection}
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="no-print">
          <TableSkeleton />
        </div>
      ) : null}
      {isError ? (
        <div className="no-print">
          <QueryError onRetry={refetch} />
        </div>
      ) : null}
      {!isLoading && !filtered.length ? (
        <div className="no-print">
          <EmptyState title={t.marksheets.empty} hint={t.marksheets.emptyHint} />
        </div>
      ) : null}

      <div className="space-y-10">
        {filtered.map((row) => (
          <div key={row._id} className={cn("relative", selectedId && selectedId !== row._id && "no-print")}>
            <div className="no-print mb-2 flex justify-end">
              <Button
                type="button"
                variant={selectedId === row._id ? "primary" : "secondary"}
                onClick={() => setSelectedId(selectedId === row._id ? null : row._id)}
              >
                {selectedId === row._id ? t.common.print : t.marksheets.printOne}
              </Button>
            </div>
            <MarksheetDocument
              row={row}
              settings={session?.data.settings}
              expectedSubjects={expectedSubjects}
              selected={selectedId === row._id || !selectedId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
