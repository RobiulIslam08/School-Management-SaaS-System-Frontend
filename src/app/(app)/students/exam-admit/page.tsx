"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Select } from "@/components/ui";
import {
  useGetClassesQuery,
  useGetExamsQuery,
  useGetStudentsQuery,
  useGetSubjectsQuery,
  useMeQuery,
} from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function ExamAdmitCardPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data: examsData } = useGetExamsQuery();
  const { data: classesData } = useGetClassesQuery();
  const { data: subjectsData } = useGetSubjectsQuery(classId || undefined);
  const { data: studentsData, isLoading, isError, refetch } = useGetStudentsQuery(
    classId ? { classId, section: section || undefined, status: "active" } : undefined
  );

  const exams = (examsData?.data ?? []) as Array<{
    _id: string;
    name: string;
    academicYear: string;
    startDate?: string;
    endDate?: string;
    schedule?: Array<{
      subjectName?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      venue?: string;
    }>;
  }>;
  const classes = (classesData?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const students = (studentsData?.data ?? []) as Array<{
    _id: string;
    name: string;
    nameBn?: string;
    studentId: string;
    rollNo: string;
    photoUrl?: string;
    section?: string;
    group?: string;
  }>;
  const subjects = (subjectsData?.data ?? []) as Array<{ _id: string; name: string; code: string }>;

  const currentExam = exams.find((e) => e._id === examId);
  const currentClass = classes.find((c) => c._id === classId);

  const printStudents = selectedStudentId
    ? students.filter((s) => s._id === selectedStudentId)
    : students;

  return (
    <div className="exam-admit-page space-y-6">
      <div className="no-print">
        <PageHeader
          title="Exam Admit Card / Hall Ticket (পরীক্ষার প্রবেশপত্র)"
          subtitle="Generate and print examination hall tickets with subject schedules, timings, and controller authorization"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!examId || !students.length}
                onClick={() => window.print()}
              >
                {t.common.print}
                {selectedStudentId
                  ? " (Single 1)"
                  : students.length
                  ? ` (All ${students.length})`
                  : ""}
              </Button>
            </div>
          }
        />

        <div className="mb-4 grid gap-3 sm:grid-cols-3 rounded-lg border border-border bg-white p-4">
          <Field label="1. Select Examination *">
            <Select
              value={examId}
              onChange={(e) => {
                setExamId(e.target.value);
                setSelectedStudentId(null);
              }}
            >
              <option value="">-- Choose Examination --</option>
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} ({ex.academicYear})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="2. Select Class *">
            <Select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSection("");
                setSelectedStudentId(null);
              }}
            >
              <option value="">-- Choose Class --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="3. Section">
            <Select
              value={section}
              onChange={(e) => {
                setSection(e.target.value);
                setSelectedStudentId(null);
              }}
            >
              <option value="">All Sections</option>
              {sectionNames(classes.find((c) => c._id === classId)?.sections as never).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {selectedStudentId && (
          <div className="mb-4 flex items-center justify-between rounded bg-muted/40 p-2 text-sm">
            <span>Viewing single student admit card.</span>
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setSelectedStudentId(null)}>
              Clear selection & show all
            </Button>
          </div>
        )}
      </div>

      {!examId || !classId ? (
        <EmptyState
          title="Select examination and class"
          hint="Please select both an examination and a class from above to generate student admit cards."
        />
      ) : isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <QueryError onRetry={refetch} />
      ) : !students.length ? (
        <EmptyState title="No active students found" hint="No active students in this class/section." />
      ) : (
        <div className="space-y-8">
          {printStudents.map((student) => (
            <div
              key={student._id}
              className={cn(
                "relative mx-auto max-w-2xl rounded-lg border-2 border-foreground/30 bg-white p-6 shadow-sm",
                "print:m-0 print:max-w-none print:border-foreground print:shadow-none print:break-after-page",
                selectedStudentId && selectedStudentId !== student._id && "no-print"
              )}
            >
              <div className="no-print absolute top-3 right-3">
                <Button
                  variant={selectedStudentId === student._id ? "primary" : "secondary"}
                  className="h-8 px-2 text-xs"
                  onClick={() =>
                    setSelectedStudentId(selectedStudentId === student._id ? null : student._id)
                  }
                >
                  {selectedStudentId === student._id ? "Printing (1)" : "Print Only This"}
                </Button>
              </div>

              {/* School Header */}
              <div className="text-center border-b-2 border-foreground/80 pb-3">
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  {session?.data.settings?.name || "School Name"}
                </h2>
                <p className="text-xs text-muted-foreground">{session?.data.settings?.address || ""}</p>
                {session?.data.settings?.eiin && (
                  <p className="text-[11px] font-mono text-muted-foreground">EIIN: {session.data.settings.eiin}</p>
                )}
                <div className="mt-2 inline-block rounded border border-foreground/80 bg-foreground/5 px-4 py-1 text-sm font-black uppercase tracking-wider">
                  ADMIT CARD / প্রবেশপত্র
                </div>
                <div className="mt-1 text-sm font-bold text-primary">{currentExam?.name}</div>
              </div>

              {/* Student Details Grid with Photo Box */}
              <div className="my-4 flex items-start justify-between gap-4">
                <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Student Name:</span>
                    <div className="font-bold text-sm text-foreground">{student.name}</div>
                    {student.nameBn && <div className="text-xs text-muted-foreground">{student.nameBn}</div>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Roll No:</span>
                    <div className="font-mono text-base font-black text-primary">{student.rollNo || "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Student ID:</span>
                    <div className="font-mono font-bold text-xs">{student.studentId}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Class & Section:</span>
                    <div className="font-semibold">
                      {currentClass?.name} {student.section ? `(Section ${student.section})` : ""}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Academic Year:</span>
                    <div className="font-mono font-medium">{currentExam?.academicYear || "2026"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Group:</span>
                    <div className="font-medium">{student.group && student.group !== "None" ? student.group : "General"}</div>
                  </div>
                </div>

                {/* Photo box */}
                <div className="flex h-24 w-20 flex-col items-center justify-center rounded border border-dashed border-foreground/40 bg-muted/20 text-center text-[10px] text-muted-foreground overflow-hidden">
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>Passport Photo</span>
                  )}
                </div>
              </div>

              {/* Exam Schedule Table */}
              <div className="mb-4">
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Examination Routine / বিষয়ভিত্তিক সময়সূচী
                </h4>
                <table className="w-full border-collapse border border-foreground/60 text-left text-xs">
                  <thead>
                    <tr className="bg-muted/30 text-[11px] font-semibold">
                      <th className="border border-foreground/60 p-1.5 text-center w-8">#</th>
                      <th className="border border-foreground/60 p-1.5">Subject</th>
                      <th className="border border-foreground/60 p-1.5 text-center">Date</th>
                      <th className="border border-foreground/60 p-1.5 text-center">Time</th>
                      <th className="border border-foreground/60 p-1.5 text-center">Venue / Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentExam?.schedule && currentExam.schedule.length > 0
                      ? currentExam.schedule
                      : subjects.map((sub, sIdx) => ({
                          subjectName: sub.name,
                          date: currentExam?.startDate,
                          startTime: "10:00 AM",
                          endTime: "01:00 PM",
                          venue: "Hall Room",
                        }))
                    ).map((sch: any, sIdx: number) => (
                      <tr key={sIdx}>
                        <td className="border border-foreground/60 p-1 text-center font-mono">{sIdx + 1}</td>
                        <td className="border border-foreground/60 p-1 font-medium">{sch.subjectName || "Subject"}</td>
                        <td className="border border-foreground/60 p-1 text-center font-mono">
                          {sch.date ? new Date(sch.date).toLocaleDateString() : "—"}
                        </td>
                        <td className="border border-foreground/60 p-1 text-center font-mono">
                          {sch.startTime ? `${sch.startTime} - ${sch.endTime || ""}` : "10:00 AM - 01:00 PM"}
                        </td>
                        <td className="border border-foreground/60 p-1 text-center">{sch.venue || "Campus Hall"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions */}
              <div className="rounded bg-muted/20 p-2 text-[10px] text-muted-foreground space-y-0.5">
                <p className="font-bold text-foreground">নির্দেশনাবলী (Rules & Instructions):</p>
                <p>১. প্রবেশপত্র ব্যতিরেকে কোনো শিক্ষার্থীকে পরীক্ষা কেন্দ্রে প্রবেশ করতে দেওয়া হবে না।</p>
                <p>২. পরীক্ষা শুরু হওয়ার অন্তত ১৫ মিনিট পূর্বে নিজ নিজ আসনে উপস্থিত হতে হবে।</p>
                <p>৩. পরীক্ষা কেন্দ্রে কোনো প্রকার মোবাইল ফোন বা ডিজিটাল ডিভাইস আনা সম্পূর্ণ নিষিদ্ধ।</p>
              </div>

              {/* Signatures */}
              <div className="mt-8 flex items-end justify-between pt-4 text-center text-xs">
                <div className="border-t border-foreground/60 pt-1 w-32">
                  <span className="font-semibold">শ্রেণি শিক্ষক</span>
                  <div className="text-[10px] text-muted-foreground">Class Teacher</div>
                </div>
                <div className="border-t border-foreground/60 pt-1 w-36">
                  <span className="font-semibold">পরীক্ষা নিয়ন্ত্রক</span>
                  <div className="text-[10px] text-muted-foreground">Exam Controller</div>
                </div>
                <div className="border-t border-foreground/60 pt-1 w-36">
                  <span className="font-semibold">প্রতিষ্ঠান প্রধান</span>
                  <div className="text-[10px] text-muted-foreground">Head of Institution</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
