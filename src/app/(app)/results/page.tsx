"use client";

import { useMemo, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  useGetClassesQuery,
  useGetExamsQuery,
  useGetResultsQuery,
  useGetStudentsQuery,
  useGetSubjectsQuery,
  useRecomputeMeritMutation,
  useSaveResultMutation,
} from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";
import { parseNumberOrZero } from "@/lib/number-input";

type MarkDraft = { cq: string | number; mcq: string | number; practical: string | number; attendance: string | number };
const emptyMarks = (): MarkDraft => ({ cq: "", mcq: "", practical: "", attendance: "" });

type ResultRow = {
  _id: string;
  gpa: number;
  letter: string;
  totalObtained: number;
  meritPosition?: number;
  studentId?: { _id?: string; name?: string; studentId?: string };
};

type StudentRow = { _id: string; name: string; studentId: string; classId?: { _id?: string } | string; section?: string };
type SubjectRow = { _id: string; name: string; markDistribution?: { cq: number; mcq: number; practical: number; attendance: number } };

export default function ResultsPage() {
  const { t } = useI18n();
  const { data: classes } = useGetClassesQuery();
  const { data: exams } = useGetExamsQuery();
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [examTypeId, setExamTypeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const { data, isLoading, isError, refetch } = useGetResultsQuery(examTypeId ? { examTypeId, classId, section } : undefined);
  const { data: students } = useGetStudentsQuery(classId ? { classId, section: section || undefined, status: "active" } : undefined);
  const { data: subjects } = useGetSubjectsQuery(classId || undefined);
  const [saveResult] = useSaveResultMutation();
  const [merit] = useRecomputeMeritMutation();
  const [draft, setDraft] = useState<Record<string, MarkDraft>>({});

  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const sections = sectionNames(classList.find((item) => item._id === classId)?.sections as never);
  const examList = (exams?.data ?? []) as Array<{ _id: string; name: string }>;
  const subjectList = ((subjects?.data ?? []) as SubjectRow[]).slice().sort((a, b) => (a as { sortOrder?: number }).sortOrder ?? 0);
  const studentList = (students?.data ?? []) as StudentRow[];
  const rows = (data?.data ?? []) as ResultRow[];
  const subject = subjectList.find((item) => item._id === subjectId);

  const resultByStudent = useMemo(() => {
    const map = new Map<string, ResultRow>();
    for (const row of rows) {
      const id = row.studentId && typeof row.studentId === "object" ? row.studentId._id : undefined;
      if (id) map.set(id, row);
    }
    return map;
  }, [rows]);

  async function saveCell(studentId: string) {
    if (!examTypeId || !subjectId) return;
    const marks = draft[studentId] ?? emptyMarks();
    const result = await saveResult({
      studentId,
      examTypeId,
      subjectMarks: [
        {
          subjectId,
          cq: parseNumberOrZero(marks.cq),
          mcq: parseNumberOrZero(marks.mcq),
          practical: parseNumberOrZero(marks.practical),
          attendance: parseNumberOrZero(marks.attendance),
        },
      ],
    });
    toastApiResult(result, t.results.saveMarks, t.common.loadError);
  }

  return (
    <div>
      <PageHeader
        title={t.results.title}
        subtitle={t.results.gridHint}
        actions={
          <Button type="button" variant="secondary" disabled={!examTypeId} onClick={async () => toastApiResult(await merit(examTypeId), t.results.merit)}>
            {t.results.merit}
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t.common.class}>
          <Select value={classId} onChange={(e) => { setClassId(e.target.value); setSection(sectionNames(classList.find((item) => item._id === e.target.value)?.sections as never)[0] ?? ""); }}>
            <option value="">{t.common.class}</option>
            {classList.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
        </Field>
        <Field label={t.common.section}>
          <Select value={section} onChange={(e) => setSection(e.target.value)}>
            {sections.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </Field>
        <Field label={t.results.pickExam}>
          <Select value={examTypeId} onChange={(e) => setExamTypeId(e.target.value)}>
            <option value="">{t.results.pickExam}</option>
            {examList.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
        </Field>
        <Field label={t.results.pickSubject}>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">{t.results.pickSubject}</option>
            {subjectList.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
        </Field>
      </div>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!classId || !examTypeId || !subjectId ? <EmptyState title={t.results.needFields} hint={t.results.gridHint} /> : null}
      {classId && examTypeId && subjectId ? (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/70 text-left text-xs uppercase text-muted-foreground">
                <th className="px-3 py-3">{t.common.student}</th>
                <th className="px-3 py-3">CQ/{subject?.markDistribution?.cq ?? 0}</th>
                <th className="px-3 py-3">MCQ/{subject?.markDistribution?.mcq ?? 0}</th>
                <th className="px-3 py-3">{t.results.practical}</th>
                <th className="px-3 py-3">{t.results.attendance}</th>
                <th className="px-3 py-3">{t.results.gpa}</th>
              </tr>
            </thead>
            <tbody>
              {studentList.map((student) => {
                const marks = draft[student._id] ?? emptyMarks();
                const saved = resultByStudent.get(student._id);
                return (
                  <tr key={student._id} className="border-t">
                    <td className="px-3 py-2 font-medium">{student.name}</td>
                    {(["cq", "mcq", "practical", "attendance"] as const).map((key) => (
                      <td key={key} className="px-3 py-2">
                        <Input
                          type="number"
                          className="h-10"
                          value={marks[key]}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [student._id]: { ...marks, [key]: e.target.value === "" ? "" : Number(e.target.value) },
                            }))
                          }
                          onBlur={() => saveCell(student._id)}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 tabular-nums">{saved?.gpa ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="mt-6">
        <DataTable
          rows={rows}
          rowKey={(row) => row._id}
          columns={[
            { header: t.results.meritCol, cell: (row) => row.meritPosition ?? "—" },
            { header: t.common.student, cell: (row) => row.studentId?.name ?? "—" },
            { header: t.results.gpa, cell: (row) => row.gpa },
            { header: t.results.grade, cell: (row) => row.letter },
            { header: t.results.total, cell: (row) => row.totalObtained },
          ]}
        />
      </div>
    </div>
  );
}
