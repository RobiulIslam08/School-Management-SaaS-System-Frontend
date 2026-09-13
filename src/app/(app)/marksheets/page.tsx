"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MarksheetDocument, type MarksheetRow } from "@/components/marksheet-document";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Select } from "@/components/ui";
import { useGetClassesQuery, useGetExamsQuery, useGetResultsQuery, useMeQuery } from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";

export default function MarksheetsPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const { data: exams } = useGetExamsQuery();
  const [examTypeId, setExamTypeId] = useState("");
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const { data: classes } = useGetClassesQuery();
  const { data, isLoading, isError, refetch } = useGetResultsQuery(examTypeId ? { examTypeId, classId, section } : undefined);
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const rows = (data?.data ?? []) as MarksheetRow[];
  const examList = (exams?.data ?? []) as Array<{ _id: string; name: string }>;

  return (
    <div>
      <PageHeader
        title={t.marksheets.title}
        subtitle={t.marksheets.subtitle}
        action={
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              {t.common.print}
            </Button>
            {examTypeId ? (
              <a
                className="inline-flex h-11 items-center rounded-md border border-border bg-white px-4 text-sm"
                href={`/api/v1/results/${examTypeId}/export`}
              >
                {t.common.excel}
              </a>
            ) : null}
          </div>
        }
      />
      <div className="no-print mb-6 grid gap-3 sm:grid-cols-3 md:max-w-3xl">
        <Field label={t.marksheets.pickExam}>
          <Select value={examTypeId} onChange={(e) => setExamTypeId(e.target.value)}>
            <option value="">{t.common.all}</option>
            {examList.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.common.class}>
          <Select value={classId} onChange={(e) => { setClassId(e.target.value); setSection(sectionNames(classList.find((item) => item._id === e.target.value)?.sections as never)[0] ?? ""); }}>
            <option value="">{t.common.all}</option>
            {classList.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t.common.section}>
          <Select value={section} onChange={(e) => setSection(e.target.value)}>
            {sectionNames(classList.find((item) => item._id === classId)?.sections as never).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </Field>
      </div>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.marksheets.empty} hint={t.marksheets.emptyHint} /> : null}
      <div className="space-y-10">
        {rows.map((row) => (
          <MarksheetDocument key={row._id} row={row} settings={session?.data.settings} />
        ))}
      </div>
    </div>
  );
}
