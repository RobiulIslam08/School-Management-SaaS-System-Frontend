"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Badge, Button, Field, Input, Select } from "@/components/ui";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  useGetClassesQuery,
  useGetExamsQuery,
  useGetResultsQuery,
  useGetStudentsQuery,
  useGetSubjectsQuery,
  useMeQuery,
  useRecomputeMeritMutation,
  useSaveResultMutation,
} from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";
import { parseNumberOrZero } from "@/lib/number-input";
import { cn } from "@/lib/utils";

type MarkDraft = { cq: string | number; mcq: string | number; practical: string | number; attendance: string | number };
const emptyMarks = (): MarkDraft => ({ cq: "", mcq: "", practical: "", attendance: "" });

type SubjectMarkSaved = {
  subjectId?: string | { _id?: string };
  cq?: number;
  mcq?: number;
  practical?: number;
  attendance?: number;
  gpa?: number;
  letter?: string;
  obtained?: number;
};

type ResultRow = {
  _id: string;
  gpa: number;
  letter: string;
  totalObtained: number;
  totalFull?: number;
  meritPosition?: number;
  subjectMarks?: SubjectMarkSaved[];
  studentId?: { _id?: string; name?: string; studentId?: string; rollNo?: string };
};

type StudentRow = {
  _id: string;
  name: string;
  studentId: string;
  rollNo?: string;
  section?: string;
  group?: string;
};

type SubjectRow = {
  _id: string;
  name: string;
  sortOrder?: number;
  compulsory?: boolean;
  group?: string;
  markDistribution?: { cq: number; mcq: number; practical: number; attendance: number };
};

function subjectKey(studentId: string, subjectId: string) {
  return `${studentId}:${subjectId}`;
}

function subjectIdOf(mark: SubjectMarkSaved): string | undefined {
  if (!mark.subjectId) return undefined;
  return typeof mark.subjectId === "string" ? mark.subjectId : mark.subjectId._id;
}

function marksFromSaved(mark?: SubjectMarkSaved): MarkDraft {
  if (!mark) return emptyMarks();
  return {
    cq: mark.cq ?? "",
    mcq: mark.mcq ?? "",
    practical: mark.practical ?? "",
    attendance: mark.attendance ?? "",
  };
}

function draftEqualsSaved(draft: MarkDraft, saved?: SubjectMarkSaved): boolean {
  if (!saved) {
    return draft.cq === "" && draft.mcq === "" && draft.practical === "" && draft.attendance === "";
  }
  return (
    Number(draft.cq === "" ? NaN : draft.cq) === (saved.cq ?? 0) &&
    Number(draft.mcq === "" ? NaN : draft.mcq) === (saved.mcq ?? 0) &&
    Number(draft.practical === "" ? NaN : draft.practical) === (saved.practical ?? 0) &&
    Number(draft.attendance === "" ? NaN : draft.attendance) === (saved.attendance ?? 0)
  );
}

function isEmptyDraft(draft: MarkDraft): boolean {
  return draft.cq === "" && draft.mcq === "" && draft.practical === "" && draft.attendance === "";
}

export default function ResultsPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const canMerit = (session?.data.user.permissions ?? []).includes("results:approve");
  const { data: classes } = useGetClassesQuery();
  const { data: exams } = useGetExamsQuery();
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [examTypeId, setExamTypeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [tab, setTab] = useState("entry");
  const [draft, setDraft] = useState<Record<string, MarkDraft>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [focusStudentId, setFocusStudentId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetResultsQuery(
    examTypeId ? { examTypeId, classId, section } : undefined
  );
  const { data: students, isLoading: studentsLoading } = useGetStudentsQuery(
    classId ? { classId, section: section || undefined, status: "active" } : undefined
  );
  const { data: subjects } = useGetSubjectsQuery(classId || undefined);
  const [saveResult] = useSaveResultMutation();
  const [merit, { isLoading: meriting }] = useRecomputeMeritMutation();

  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const sections = sectionNames(classList.find((item) => item._id === classId)?.sections as never);
  const examList = (exams?.data ?? []) as Array<{ _id: string; name: string }>;
  const subjectList = ((subjects?.data ?? []) as SubjectRow[])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const studentList = (students?.data ?? []) as StudentRow[];
  const rows = (data?.data ?? []) as ResultRow[];
  const subject = subjectList.find((item) => item._id === subjectId);
  const caps = subject?.markDistribution;
  const showPractical = (caps?.practical ?? 0) > 0;
  const showAttendance = (caps?.attendance ?? 0) > 0;

  const resultByStudent = useMemo(() => {
    const map = new Map<string, ResultRow>();
    for (const row of rows) {
      const id = row.studentId && typeof row.studentId === "object" ? row.studentId._id : undefined;
      if (id) map.set(id, row);
    }
    return map;
  }, [rows]);

  // Hydrate draft from saved marks when results/subject change
  useEffect(() => {
    if (!subjectId || !studentList.length) return;
    setDraft((prev) => {
      const next = { ...prev };
      for (const student of studentList) {
        const key = subjectKey(student._id, subjectId);
        if (dirty[key]) continue;
        const saved = resultByStudent.get(student._id);
        const mark = saved?.subjectMarks?.find((item) => subjectIdOf(item) === subjectId);
        next[key] = marksFromSaved(mark);
      }
      return next;
    });
  }, [subjectId, studentList, resultByStudent, dirty]);

  const progress = useMemo(() => {
    let completeStudents = 0;
    let enteredCells = 0;
    const totalCells = studentList.length * subjectList.length;
    const matrix: Record<string, Record<string, boolean>> = {};
    for (const student of studentList) {
      const saved = resultByStudent.get(student._id);
      const enteredIds = new Set((saved?.subjectMarks ?? []).map((m) => subjectIdOf(m)).filter(Boolean) as string[]);
      matrix[student._id] = {};
      let studentComplete = subjectList.length > 0;
      for (const sub of subjectList) {
        const has = enteredIds.has(sub._id);
        matrix[student._id][sub._id] = has;
        if (has) enteredCells += 1;
        else studentComplete = false;
      }
      if (studentComplete) completeStudents += 1;
    }
    return { matrix, enteredCells, totalCells, completeStudents };
  }, [studentList, subjectList, resultByStudent]);

  function getDraft(studentId: string): MarkDraft {
    if (!subjectId) return emptyMarks();
    return draft[subjectKey(studentId, subjectId)] ?? emptyMarks();
  }

  function setDraftField(studentId: string, key: keyof MarkDraft, value: string) {
    if (!subjectId) return;
    const sk = subjectKey(studentId, subjectId);
    const current = draft[sk] ?? emptyMarks();
    setDraft((prev) => ({
      ...prev,
      [sk]: { ...current, [key]: value === "" ? "" : Number(value) },
    }));
    setDirty((prev) => ({ ...prev, [sk]: true }));
  }

  async function saveOne(studentId: string, opts?: { silent?: boolean }) {
    if (!examTypeId || !subjectId) return false;
    const sk = subjectKey(studentId, subjectId);
    const marks = draft[sk] ?? emptyMarks();
    const saved = resultByStudent.get(studentId);
    const savedMark = saved?.subjectMarks?.find((item) => subjectIdOf(item) === subjectId);
    if (!dirty[sk] && (isEmptyDraft(marks) || draftEqualsSaved(marks, savedMark))) {
      return true;
    }
    if (isEmptyDraft(marks) && !savedMark) return true;

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
    if (!opts?.silent) toastApiResult(result, t.results.saveMarks, t.common.loadError);
    if ("data" in result) {
      setDirty((prev) => {
        const next = { ...prev };
        delete next[sk];
        return next;
      });
      return true;
    }
    return false;
  }

  async function saveAllDirty() {
    if (!examTypeId || !subjectId) return;
    const keys = Object.keys(dirty).filter((k) => dirty[k] && k.endsWith(`:${subjectId}`));
    if (!keys.length) {
      toast.message(t.results.saveMarks);
      return;
    }
    setSavingAll(true);
    let ok = 0;
    for (const key of keys) {
      const studentId = key.split(":")[0];
      if (await saveOne(studentId, { silent: true })) ok += 1;
    }
    setSavingAll(false);
    toast.success(`${ok}/${keys.length}`);
  }

  const dirtyCount = Object.values(dirty).filter(Boolean).length;

  const marksheetsHref =
    examTypeId && classId
      ? `/marksheets?exam=${examTypeId}&class=${classId}${section ? `&section=${section}` : ""}`
      : "/marksheets";

  return (
    <div>
      <PageHeader
        title={t.results.title}
        subtitle={t.results.subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={marksheetsHref}>
              <Button type="button" variant="secondary">
                {t.results.openMarksheets}
              </Button>
            </Link>
            {canMerit ? (
              <Button
                type="button"
                variant="secondary"
                disabled={!examTypeId || !classId || meriting}
                onClick={async () =>
                  toastApiResult(
                    await merit({ examTypeId, classId, section: section || undefined }),
                    t.results.merit
                  )
                }
              >
                {t.results.merit}
              </Button>
            ) : null}
            <Button type="button" disabled={!subjectId || !dirtyCount || savingAll} onClick={saveAllDirty}>
              {savingAll ? t.results.saving : t.results.saveAll}
              {dirtyCount ? ` (${dirtyCount})` : ""}
            </Button>
          </div>
        }
      />

      <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t.common.class} htmlFor="res-class">
            <Select
              id="res-class"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSection(sectionNames(classList.find((item) => item._id === e.target.value)?.sections as never)[0] ?? "");
                setSubjectId("");
                setDirty({});
              }}
            >
              <option value="">{t.common.class}</option>
              {classList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.common.section} htmlFor="res-section">
            <Select id="res-section" value={section} onChange={(e) => setSection(e.target.value)}>
              {sections.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.results.pickExam} htmlFor="res-exam">
            <Select id="res-exam" value={examTypeId} onChange={(e) => setExamTypeId(e.target.value)}>
              <option value="">{t.results.pickExam}</option>
              {examList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.results.pickSubject} htmlFor="res-subject">
            <Select id="res-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">{t.results.pickSubject}</option>
              {subjectList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {classId && examTypeId ? (
        <p className="mb-3 text-sm text-muted-foreground">
          {t.results.progressSummary
            .replace("{entered}", String(progress.enteredCells))
            .replace("{total}", String(progress.totalCells || 0))
            .replace("{complete}", String(progress.completeStudents))
            .replace("{students}", String(studentList.length))}
        </p>
      ) : null}

      <WorkspaceTabs
        tabs={[
          { id: "entry", label: t.results.tabEntry },
          { id: "progress", label: t.results.tabProgress },
        ]}
        active={tab}
        onChange={setTab}
      />

      {isLoading || studentsLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}

      {tab === "entry" ? (
        <>
          {!classId || !examTypeId || !subjectId ? (
            <EmptyState title={t.results.needFields} hint={t.results.gridHint} />
          ) : null}
          {classId && examTypeId && subjectId && !studentList.length ? (
            <EmptyState title={t.results.emptyStudents} hint={t.results.gridHint} />
          ) : null}
          {classId && examTypeId && subjectId && studentList.length ? (
            <>
              {/* Desktop grid */}
              <div className="hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/70 text-left text-xs uppercase text-muted-foreground">
                      <th className="px-3 py-3">{t.common.student}</th>
                      <th className="px-3 py-3">
                        {t.results.cq}/{caps?.cq ?? 0}
                      </th>
                      <th className="px-3 py-3">
                        {t.results.mcq}/{caps?.mcq ?? 0}
                      </th>
                      {showPractical ? (
                        <th className="px-3 py-3">
                          {t.results.practical}/{caps?.practical ?? 0}
                        </th>
                      ) : null}
                      {showAttendance ? (
                        <th className="px-3 py-3">
                          {t.results.attendance}/{caps?.attendance ?? 0}
                        </th>
                      ) : null}
                      <th className="px-3 py-3">{t.common.status}</th>
                      <th className="px-3 py-3">{t.results.subjectGpa}</th>
                      <th className="px-3 py-3">{t.results.overallSummary}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentList.map((student) => {
                      const sk = subjectKey(student._id, subjectId);
                      const marks = getDraft(student._id);
                      const saved = resultByStudent.get(student._id);
                      const savedMark = saved?.subjectMarks?.find((item) => subjectIdOf(item) === subjectId);
                      const isDirty = Boolean(dirty[sk]);
                      const status = isDirty
                        ? t.results.statusDraft
                        : savedMark
                          ? t.results.statusSaved
                          : t.results.statusMissing;
                      return (
                        <tr
                          key={student._id}
                          id={`student-row-${student._id}`}
                          className={cn("border-t", focusStudentId === student._id && "bg-primary/5")}
                        >
                          <td className="px-3 py-2">
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.studentId}
                              {student.rollNo ? ` · ${student.rollNo}` : ""}
                            </p>
                          </td>
                          {(["cq", "mcq"] as const).map((key) => (
                            <td key={key} className="px-3 py-2">
                              <Input
                                type="number"
                                className="h-10"
                                min={0}
                                max={caps?.[key] ?? undefined}
                                value={marks[key]}
                                onChange={(e) => setDraftField(student._id, key, e.target.value)}
                                onBlur={() => saveOne(student._id)}
                              />
                            </td>
                          ))}
                          {showPractical ? (
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                className="h-10"
                                min={0}
                                max={caps?.practical}
                                value={marks.practical}
                                onChange={(e) => setDraftField(student._id, "practical", e.target.value)}
                                onBlur={() => saveOne(student._id)}
                              />
                            </td>
                          ) : null}
                          {showAttendance ? (
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                className="h-10"
                                min={0}
                                max={caps?.attendance}
                                value={marks.attendance}
                                onChange={(e) => setDraftField(student._id, "attendance", e.target.value)}
                                onBlur={() => saveOne(student._id)}
                              />
                            </td>
                          ) : null}
                          <td className="px-3 py-2">
                            <Badge
                              className={cn(
                                isDirty && "bg-amber-100 text-amber-900",
                                !isDirty && savedMark && "bg-emerald-100 text-emerald-900",
                                !isDirty && !savedMark && "bg-red-100 text-red-800"
                              )}
                            >
                              {status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 tabular-nums">{savedMark?.gpa ?? "—"}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {saved ? `${saved.gpa} · ${saved.letter}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {studentList.map((student) => {
                  const sk = subjectKey(student._id, subjectId);
                  const marks = getDraft(student._id);
                  const saved = resultByStudent.get(student._id);
                  const savedMark = saved?.subjectMarks?.find((item) => subjectIdOf(item) === subjectId);
                  return (
                    <div key={student._id} className="space-y-3 rounded-xl border border-border bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.studentId}</p>
                        </div>
                        <Badge>{dirty[sk] ? t.results.statusDraft : savedMark ? t.results.statusSaved : t.results.statusMissing}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label={`${t.results.cq}/${caps?.cq ?? 0}`}>
                          <Input
                            type="number"
                            min={0}
                            max={caps?.cq}
                            value={marks.cq}
                            onChange={(e) => setDraftField(student._id, "cq", e.target.value)}
                          />
                        </Field>
                        <Field label={`${t.results.mcq}/${caps?.mcq ?? 0}`}>
                          <Input
                            type="number"
                            min={0}
                            max={caps?.mcq}
                            value={marks.mcq}
                            onChange={(e) => setDraftField(student._id, "mcq", e.target.value)}
                          />
                        </Field>
                        {showPractical ? (
                          <Field label={`${t.results.practical}/${caps?.practical ?? 0}`}>
                            <Input
                              type="number"
                              min={0}
                              max={caps?.practical}
                              value={marks.practical}
                              onChange={(e) => setDraftField(student._id, "practical", e.target.value)}
                            />
                          </Field>
                        ) : null}
                        {showAttendance ? (
                          <Field label={`${t.results.attendance}/${caps?.attendance ?? 0}`}>
                            <Input
                              type="number"
                              min={0}
                              max={caps?.attendance}
                              value={marks.attendance}
                              onChange={(e) => setDraftField(student._id, "attendance", e.target.value)}
                            />
                          </Field>
                        ) : null}
                      </div>
                      <Button type="button" className="w-full" onClick={() => saveOne(student._id)}>
                        {t.results.saveMarks}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {tab === "progress" ? (
        !classId || !examTypeId ? (
          <EmptyState title={t.results.needFields} hint={t.results.gridHint} />
        ) : !subjectList.length || !studentList.length ? (
          <EmptyState title={t.results.emptyStudents} hint={t.results.gridHint} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/70 text-left">
                  <th className="sticky left-0 z-10 bg-muted/70 px-3 py-3">{t.common.student}</th>
                  {subjectList.map((sub) => (
                    <th key={sub._id} className="max-w-[5.5rem] truncate px-2 py-3" title={sub.name}>
                      {sub.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentList.map((student) => (
                  <tr key={student._id} className="border-t">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium">{student.name}</td>
                    {subjectList.map((sub) => {
                      const has = progress.matrix[student._id]?.[sub._id];
                      return (
                        <td key={sub._id} className="px-2 py-2">
                          <button
                            type="button"
                            className={cn(
                              "h-8 w-full rounded-md text-[11px] font-medium",
                              has ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-800"
                            )}
                            onClick={() => {
                              setSubjectId(sub._id);
                              setFocusStudentId(student._id);
                              setTab("entry");
                              requestAnimationFrame(() => {
                                document.getElementById(`student-row-${student._id}`)?.scrollIntoView({ block: "center" });
                              });
                            }}
                          >
                            {has ? t.results.statusSaved : t.results.statusMissing}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">{t.results.merit}</h2>
        {!rows.length ? (
          <EmptyState title={t.results.merit} hint={t.results.gridHint} />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(row) => row._id}
            pageSize={15}
            columns={[
              { header: t.results.meritCol, sortValue: (row) => row.meritPosition ?? 9999, cell: (row) => row.meritPosition ?? "—" },
              { header: t.common.student, sortValue: (row) => row.studentId?.name ?? "", cell: (row) => row.studentId?.name ?? "—" },
              { header: t.results.gpa, sortValue: (row) => row.gpa, cell: (row) => row.gpa },
              { header: t.results.grade, cell: (row) => row.letter },
              { header: t.results.total, sortValue: (row) => row.totalObtained, cell: (row) => row.totalObtained },
            ]}
          />
        )}
      </div>
    </div>
  );
}
