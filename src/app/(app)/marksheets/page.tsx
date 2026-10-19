"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MarksheetDocument, type MarksheetRow } from "@/components/marksheet-document";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select } from "@/components/ui";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  useGetClassesQuery,
  useGetExamsQuery,
  useGetFailListQuery,
  useGetPassListQuery,
  useGetResultsQuery,
  useGetResultStatsQuery,
  useGetSubjectsQuery,
  useMeQuery,
} from "@/lib/api/schoolApi";
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
  const [activeTab, setActiveTab] = useState<"marksheets" | "pass" | "fail" | "stats">("marksheets");
  const [examTypeId, setExamTypeId] = useState("");
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [q, setQ] = useState("");
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: classes } = useGetClassesQuery();
  const { data: subjects } = useGetSubjectsQuery(classId || undefined);

  // Main results query
  const { data, isLoading, isError, refetch } = useGetResultsQuery(
    examTypeId ? { examTypeId, classId, section } : undefined
  );

  // Pass, Fail, Stats queries
  const { data: passData, isLoading: passLoading } = useGetPassListQuery(
    { examTypeId, classId, section },
    { skip: !examTypeId || activeTab !== "pass" }
  );
  const { data: failData, isLoading: failLoading } = useGetFailListQuery(
    { examTypeId, classId, section },
    { skip: !examTypeId || activeTab !== "fail" }
  );
  const { data: statsData, isLoading: statsLoading } = useGetResultStatsQuery(
    { examTypeId, classId, section },
    { skip: !examTypeId || activeTab !== "stats" }
  );

  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const rows = (data?.data ?? []) as MarksheetRow[];
  const examList = (exams?.data ?? []) as Array<{ _id: string; name: string }>;
  const expectedSubjects = ((subjects?.data ?? []) as unknown[]).length;
  const currentExam = examList.find((e) => e._id === examTypeId);
  const currentClass = classList.find((c) => c._id === classId);

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

  const tabs = [
    { id: "marksheets", label: t.marksheets.title || "Marksheets" },
    { id: "pass", label: "Pass List (পাশের তালিকা)" },
    { id: "fail", label: "Fail List (ফেলের তালিকা)" },
    { id: "stats", label: "Statistics & Avg % (পরিসংখ্যান ও গড় হার)" },
  ];

  return (
    <div className="marksheets-page">
      <div className="no-print">
        <PageHeader
          title={t.marksheets.title}
          subtitle={t.marksheets.subtitle}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={!examTypeId} onClick={() => window.print()}>
                {t.common.print}
                {activeTab === "marksheets" && (selectedId ? ` (1)` : printRows.length ? ` (${printRows.length})` : "")}
              </Button>
              {exportHref ? (
                <a
                  className="inline-flex h-11 items-center rounded-md border border-border bg-white px-4 text-sm font-medium"
                  href={exportHref}
                >
                  {t.common.excel}
                </a>
              ) : null}
            </div>
          }
        />

        <WorkspaceTabs
          tabs={tabs}
          active={activeTab}
          onChange={(tab) => {
            setActiveTab(tab as typeof activeTab);
            setSelectedId(null);
          }}
        />

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label={t.marksheets.pickExam} htmlFor="ms-exam">
            <Select
              id="ms-exam"
              value={examTypeId}
              onChange={(e) => {
                setExamTypeId(e.target.value);
                setSelectedId(null);
              }}
            >
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
              <option value="">{t.common.all}</option>
              {sectionNames(classList.find((item) => item._id === classId)?.sections as never).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          {activeTab === "marksheets" && (
            <>
              <Field label={t.common.search} htmlFor="ms-q">
                <Input
                  id="ms-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t.common.searchPlaceholder}
                />
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
            </>
          )}
        </div>

        {selectedId && activeTab === "marksheets" ? (
          <div className="mb-4">
            <Button type="button" variant="ghost" onClick={() => setSelectedId(null)}>
              {t.marksheets.clearSelection}
            </Button>
          </div>
        ) : null}
      </div>

      {/* TAB 1: MARKSHEETS */}
      {activeTab === "marksheets" && (
        <>
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
        </>
      )}

      {/* TAB 2: PASS LIST */}
      {activeTab === "pass" && (
        <div className="bg-white p-6 rounded-lg border border-border print:p-0 print:border-none">
          {passLoading ? (
            <TableSkeleton />
          ) : (
            <div>
              <div className="mb-4 text-center">
                <h2 className="text-xl font-bold">{session?.data.settings?.name || "School Name"}</h2>
                <p className="text-sm text-muted-foreground">{session?.data.settings?.address || ""}</p>
                <div className="mt-2 inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-800">
                  Passed Students List (উত্তীর্ণ শিক্ষার্থীদের তালিকা)
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Exam: {currentExam?.name ?? "All Exams"} {currentClass ? `| Class: ${currentClass.name}` : ""}{" "}
                  {section ? `| Section: ${section}` : ""} | Total Passed: {passData?.data?.length ?? 0}
                </p>
              </div>

              {!passData?.data?.length ? (
                <EmptyState title="No passed records found" hint="Select an exam with finalized results." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-left text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-xs font-semibold uppercase">
                        <th className="border border-border p-2 text-center w-12">#</th>
                        <th className="border border-border p-2">Roll</th>
                        <th className="border border-border p-2">Student ID</th>
                        <th className="border border-border p-2">Student Name</th>
                        <th className="border border-border p-2">Class / Section</th>
                        <th className="border border-border p-2 text-center">GPA</th>
                        <th className="border border-border p-2 text-center">Grade</th>
                        <th className="border border-border p-2 text-center">Total Marks</th>
                        <th className="border border-border p-2 text-center">Merit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passData.data.map((row: any, idx: number) => (
                        <tr key={row._id} className="hover:bg-muted/20">
                          <td className="border border-border p-2 text-center font-mono">{idx + 1}</td>
                          <td className="border border-border p-2 font-mono font-medium">{row.studentId?.rollNo || "-"}</td>
                          <td className="border border-border p-2 font-mono text-xs">{row.studentId?.studentId || "-"}</td>
                          <td className="border border-border p-2 font-medium">
                            {row.studentId?.name}
                            {row.studentId?.nameBn ? <span className="block text-xs text-muted-foreground">{row.studentId.nameBn}</span> : null}
                          </td>
                          <td className="border border-border p-2">
                            {row.studentId?.classId?.name || currentClass?.name || "-"} {row.studentId?.section ? `(${row.studentId.section})` : ""}
                          </td>
                          <td className="border border-border p-2 text-center font-bold text-emerald-700">{row.gpa?.toFixed(2) ?? "-"}</td>
                          <td className="border border-border p-2 text-center font-semibold">{row.letter ?? "-"}</td>
                          <td className="border border-border p-2 text-center font-mono">{row.totalObtained ?? "-"}</td>
                          <td className="border border-border p-2 text-center font-bold">{row.meritPosition ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FAIL LIST */}
      {activeTab === "fail" && (
        <div className="bg-white p-6 rounded-lg border border-border print:p-0 print:border-none">
          {failLoading ? (
            <TableSkeleton />
          ) : (
            <div>
              <div className="mb-4 text-center">
                <h2 className="text-xl font-bold">{session?.data.settings?.name || "School Name"}</h2>
                <p className="text-sm text-muted-foreground">{session?.data.settings?.address || ""}</p>
                <div className="mt-2 inline-block rounded-full bg-rose-100 px-4 py-1 text-sm font-semibold text-rose-800">
                  Failed Students List (অনুত্তীর্ণ শিক্ষার্থীদের তালিকা)
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Exam: {currentExam?.name ?? "All Exams"} {currentClass ? `| Class: ${currentClass.name}` : ""}{" "}
                  {section ? `| Section: ${section}` : ""} | Total Failed: {failData?.data?.length ?? 0}
                </p>
              </div>

              {!failData?.data?.length ? (
                <EmptyState title="No failed students recorded" hint="All students have passed or no results entered." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-left text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-xs font-semibold uppercase">
                        <th className="border border-border p-2 text-center w-12">#</th>
                        <th className="border border-border p-2">Roll</th>
                        <th className="border border-border p-2">Student ID</th>
                        <th className="border border-border p-2">Student Name</th>
                        <th className="border border-border p-2">Class / Section</th>
                        <th className="border border-border p-2 text-center">GPA</th>
                        <th className="border border-border p-2 text-center">Grade</th>
                        <th className="border border-border p-2">Failed Subjects</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failData.data.map((row: any, idx: number) => (
                        <tr key={row._id} className="hover:bg-muted/20">
                          <td className="border border-border p-2 text-center font-mono">{idx + 1}</td>
                          <td className="border border-border p-2 font-mono font-medium">{row.studentId?.rollNo || "-"}</td>
                          <td className="border border-border p-2 font-mono text-xs">{row.studentId?.studentId || "-"}</td>
                          <td className="border border-border p-2 font-medium">
                            {row.studentId?.name}
                            {row.studentId?.nameBn ? <span className="block text-xs text-muted-foreground">{row.studentId.nameBn}</span> : null}
                          </td>
                          <td className="border border-border p-2">
                            {row.studentId?.classId?.name || currentClass?.name || "-"} {row.studentId?.section ? `(${row.studentId.section})` : ""}
                          </td>
                          <td className="border border-border p-2 text-center font-bold text-rose-700">{row.gpa?.toFixed(2) ?? "0.00"}</td>
                          <td className="border border-border p-2 text-center font-semibold text-rose-700">{row.letter ?? "F"}</td>
                          <td className="border border-border p-2">
                            <div className="flex flex-wrap gap-1">
                              {(row.failedSubjects || []).map((sub: any, sIdx: number) => (
                                <span
                                  key={sub?._id || sIdx}
                                  className="inline-block rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-medium text-rose-800"
                                >
                                  {sub?.name || sub?.code || "Subject"}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STATISTICS & AVERAGE % */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {statsLoading ? (
            <TableSkeleton />
          ) : (
            <>
              {/* Stat summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-lg border border-border bg-white p-4 text-center">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Students</div>
                  <div className="mt-1 text-2xl font-bold">{statsData?.data?.total ?? 0}</div>
                </div>
                <div className="rounded-lg border border-border bg-emerald-50/50 p-4 text-center">
                  <div className="text-xs uppercase tracking-wider text-emerald-800 font-medium">Passed</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-700">{statsData?.data?.passed ?? 0}</div>
                </div>
                <div className="rounded-lg border border-border bg-rose-50/50 p-4 text-center">
                  <div className="text-xs uppercase tracking-wider text-rose-800 font-medium">Failed</div>
                  <div className="mt-1 text-2xl font-bold text-rose-700">{statsData?.data?.failed ?? 0}</div>
                </div>
                <div className="rounded-lg border border-border bg-blue-50/50 p-4 text-center">
                  <div className="text-xs uppercase tracking-wider text-blue-800 font-medium">Pass Rate</div>
                  <div className="mt-1 text-2xl font-bold text-blue-700">
                    {statsData?.data?.passRate !== undefined ? `${statsData.data.passRate.toFixed(1)}%` : "0%"}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-amber-50/50 p-4 text-center">
                  <div className="text-xs uppercase tracking-wider text-amber-800 font-medium">Average GPA</div>
                  <div className="mt-1 text-2xl font-bold text-amber-700">
                    {statsData?.data?.avgGpa !== undefined ? statsData.data.avgGpa.toFixed(2) : "0.00"}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-indigo-50/50 p-4 text-center">
                  <div className="text-xs uppercase tracking-wider text-indigo-800 font-medium">Average %</div>
                  <div className="mt-1 text-2xl font-bold text-indigo-700">
                    {statsData?.data?.avgPercent !== undefined ? `${statsData.data.avgPercent.toFixed(1)}%` : "0%"}
                  </div>
                </div>
              </div>

              {/* Subject-wise breakdown table */}
              <div className="rounded-lg border border-border bg-white p-6 print:p-0 print:border-none">
                <h3 className="text-base font-semibold mb-3">Subject-wise Average Marks & Pass Rates</h3>
                {!(statsData?.data?.subjectStats || []).length ? (
                  <EmptyState title="No subject stats available" hint="Select an exam with marks." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border text-left text-sm">
                      <thead>
                        <tr className="bg-muted/50 text-xs font-semibold uppercase">
                          <th className="border border-border p-2">Subject Name</th>
                          <th className="border border-border p-2">Subject Code</th>
                          <th className="border border-border p-2 text-center">Students Count</th>
                          <th className="border border-border p-2 text-center">Avg Marks</th>
                          <th className="border border-border p-2 text-center">Avg Percentage (%)</th>
                          <th className="border border-border p-2 text-center">Pass Rate (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData?.data?.subjectStats?.map((sub: any) => (
                          <tr key={sub.subjectId} className="hover:bg-muted/20">
                            <td className="border border-border p-2 font-medium">{sub.name || "Subject"}</td>
                            <td className="border border-border p-2 font-mono text-xs">{sub.code || "-"}</td>
                            <td className="border border-border p-2 text-center">{sub.count}</td>
                            <td className="border border-border p-2 text-center font-bold">{sub.avgObtained.toFixed(1)}</td>
                            <td className="border border-border p-2 text-center font-semibold text-indigo-700">
                              {sub.avgPercent.toFixed(1)}%
                            </td>
                            <td className="border border-border p-2 text-center font-bold text-emerald-700">
                              {sub.passRate.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
