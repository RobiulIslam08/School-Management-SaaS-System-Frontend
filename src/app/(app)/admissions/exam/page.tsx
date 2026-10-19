"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Dialog } from "@/components/dialog";
import { EmptyState, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  useBulkSaveAdmissionResultsMutation,
  useCreateAdmissionExamMutation,
  useDeleteAdmissionExamMutation,
  useGetAdmissionExamsQuery,
  useGetAdmissionResultsQuery,
  useGetClassesQuery,
  useMeQuery,
  usePublishAdmissionExamMutation,
  useUpdateAdmissionExamMutation,
  useUpsertAdmissionResultMutation,
} from "@/lib/api/schoolApi";
import { toastApiResult } from "@/lib/toast-api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function AdmissionExamPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const [activeTab, setActiveTab] = useState<"exams" | "results">("exams");
  const [selectedExamId, setSelectedExamId] = useState("");

  // Exam Dialog state
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examName, setExamName] = useState("");
  const [academicYear, setAcademicYear] = useState(session?.data.settings?.academicYear || "2026");
  const [classId, setClassId] = useState("");
  const [className, setClassName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [totalMark, setTotalMark] = useState(100);
  const [passMark, setPassMark] = useState(40);
  const [venue, setVenue] = useState("");
  const [examDesc, setExamDesc] = useState("");

  // Result entry state
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [roll, setRoll] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantNameBn, setApplicantNameBn] = useState("");
  const [phone, setPhone] = useState("");
  const [marks, setMarks] = useState(0);
  const [resultStatus, setResultStatus] = useState<"pass" | "fail" | "pending">("pass");
  const [notes, setNotes] = useState("");

  // Bulk Entry Dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkCsv, setBulkCsv] = useState("");

  const { data: classesData } = useGetClassesQuery();
  const { data: examsData, isLoading: examsLoading } = useGetAdmissionExamsQuery();
  const { data: resultsData, isLoading: resultsLoading } = useGetAdmissionResultsQuery(selectedExamId, {
    skip: !selectedExamId,
  });

  const [createExam, { isLoading: isCreatingExam }] = useCreateAdmissionExamMutation();
  const [updateExam, { isLoading: isUpdatingExam }] = useUpdateAdmissionExamMutation();
  const [deleteExam] = useDeleteAdmissionExamMutation();
  const [publishExam] = usePublishAdmissionExamMutation();
  const [upsertResult, { isLoading: isSavingResult }] = useUpsertAdmissionResultMutation();
  const [bulkSaveResults, { isLoading: isSavingBulk }] = useBulkSaveAdmissionResultsMutation();

  const exams = (examsData?.data ?? []) as Array<{
    _id: string;
    name: string;
    academicYear: string;
    className?: string;
    classId?: string;
    date?: string;
    totalMark: number;
    passMark: number;
    venue?: string;
    isPublished: boolean;
    description?: string;
  }>;

  const results = (resultsData?.data ?? []) as Array<{
    _id: string;
    roll: string;
    applicantName: string;
    applicantNameBn?: string;
    phone?: string;
    marks: number;
    status: "pass" | "fail" | "pending";
    notes?: string;
  }>;

  const currentExam = exams.find((e) => e._id === selectedExamId);
  const classesList = (classesData?.data ?? []) as Array<{ _id: string; name: string }>;

  function openCreateExam() {
    setEditingExamId(null);
    setExamName("");
    setAcademicYear(session?.data.settings?.academicYear || "2026");
    setClassId("");
    setClassName("");
    setExamDate("");
    setTotalMark(100);
    setPassMark(40);
    setVenue("");
    setExamDesc("");
    setExamDialogOpen(true);
  }

  function openEditExam(exam: (typeof exams)[number]) {
    setEditingExamId(exam._id);
    setExamName(exam.name);
    setAcademicYear(exam.academicYear);
    setClassId(exam.classId || "");
    setClassName(exam.className || "");
    setExamDate(exam.date ? new Date(exam.date).toISOString().slice(0, 10) : "");
    setTotalMark(exam.totalMark);
    setPassMark(exam.passMark);
    setVenue(exam.venue || "");
    setExamDesc(exam.description || "");
    setExamDialogOpen(true);
  }

  async function handleSaveExam(e: React.FormEvent) {
    e.preventDefault();
    if (!examName.trim() || !academicYear) {
      toast.error("Exam name and academic year are required");
      return;
    }

    const matchedClass = classesList.find((c) => c._id === classId);
    const payload = {
      name: examName.trim(),
      academicYear,
      classId: classId || undefined,
      className: matchedClass?.name || className || "",
      date: examDate || undefined,
      totalMark: Number(totalMark),
      passMark: Number(passMark),
      venue: venue.trim(),
      description: examDesc.trim(),
    };

    if (editingExamId) {
      const res = await updateExam({ id: editingExamId, ...payload });
      toastApiResult(res, "Admission exam updated");
    } else {
      const res = await createExam(payload);
      toastApiResult(res, "Admission exam created");
    }
    setExamDialogOpen(false);
  }

  async function handleDeleteExam(id: string) {
    if (!confirm("Are you sure? This will delete the exam and all its candidate marks!")) return;
    const res = await deleteExam(id);
    toastApiResult(res, "Admission exam deleted");
    if (selectedExamId === id) setSelectedExamId("");
  }

  async function handleTogglePublish(exam: (typeof exams)[number]) {
    const nextStatus = !exam.isPublished;
    const res = await publishExam({ id: exam._id, isPublished: nextStatus });
    toastApiResult(res, nextStatus ? "Results published online!" : "Results unpublished.");
  }

  function openAddResult() {
    setRoll("");
    setApplicantName("");
    setApplicantNameBn("");
    setPhone("");
    setMarks(0);
    setResultStatus("pass");
    setNotes("");
    setResultDialogOpen(true);
  }

  async function handleSaveResult(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExamId) {
      toast.error("Please select an admission exam first");
      return;
    }
    if (!roll.trim() || !applicantName.trim()) {
      toast.error("Roll and applicant name are required");
      return;
    }

    const res = await upsertResult({
      examId: selectedExamId,
      roll: roll.trim(),
      applicantName: applicantName.trim(),
      applicantNameBn: applicantNameBn.trim(),
      phone: phone.trim(),
      marks: Number(marks),
      status: resultStatus,
      notes: notes.trim(),
    });
    toastApiResult(res, "Applicant result saved");
    setResultDialogOpen(false);
  }

  async function handleBulkSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExamId) {
      toast.error("Please select an admission exam");
      return;
    }
    if (!bulkCsv.trim()) {
      toast.error("Please paste CSV data");
      return;
    }

    // Format: Roll, Name, Marks, Phone
    const lines = bulkCsv.trim().split("\n");
    const parsed = [];
    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const r = parts[0];
        const n = parts[1];
        const m = Number(parts[2]) || 0;
        const p = parts[3] || "";
        parsed.push({
          roll: r,
          applicantName: n,
          marks: m,
          phone: p,
          status: currentExam && m >= currentExam.passMark ? ("pass" as const) : ("fail" as const),
        });
      }
    }

    if (!parsed.length) {
      toast.error("Could not parse any valid rows. Format: Roll, Name, Marks, Phone");
      return;
    }

    const res = await bulkSaveResults({ examId: selectedExamId, results: parsed });
    toastApiResult(res, `Saved ${parsed.length} applicant results`);
    setBulkDialogOpen(false);
    setBulkCsv("");
  }

  const passCount = useMemo(() => results.filter((r) => r.status === "pass").length, [results]);
  const failCount = useMemo(() => results.filter((r) => r.status === "fail").length, [results]);

  return (
    <div className="admission-exam-page space-y-6">
      <div className="no-print">
        <PageHeader
          title="Admission Exams & Results (ভর্তি পরীক্ষা ও ফলাফল)"
          subtitle="Manage admission entrance exams, enter applicant marks, and publish results to public website"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                {t.common.print}
              </Button>
              <Button onClick={openCreateExam}>+ New Admission Exam (নতুন ভর্তি পরীক্ষা)</Button>
            </div>
          }
        />

        <WorkspaceTabs
          tabs={[
            { id: "exams", label: "Admission Exams List (ভর্তি পরীক্ষা তালিকা)" },
            { id: "results", label: "Applicant Marks & Results (পরীক্ষার ফলাফল এন্ট্রি)" },
          ]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as typeof activeTab)}
        />
      </div>

      {/* TAB 1: EXAMS LIST */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          {examsLoading ? (
            <TableSkeleton />
          ) : !exams.length ? (
            <EmptyState title="No admission exams found" hint="Click 'New Admission Exam' above to schedule one." />
          ) : (
            <div className="rounded-lg border border-border bg-white p-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border text-left text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-xs font-semibold uppercase">
                      <th className="border border-border p-2">Exam Name</th>
                      <th className="border border-border p-2">Year</th>
                      <th className="border border-border p-2">Target Class</th>
                      <th className="border border-border p-2">Date & Venue</th>
                      <th className="border border-border p-2 text-center">Marks (Total / Pass)</th>
                      <th className="border border-border p-2 text-center">Website Status</th>
                      <th className="border border-border p-2 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr key={exam._id} className="hover:bg-muted/20">
                        <td className="border border-border p-2 font-medium">
                          {exam.name}
                          {exam.description && (
                            <span className="block text-xs text-muted-foreground">{exam.description}</span>
                          )}
                        </td>
                        <td className="border border-border p-2 font-mono text-xs">{exam.academicYear}</td>
                        <td className="border border-border p-2">{exam.className || "All Classes"}</td>
                        <td className="border border-border p-2 text-xs">
                          {exam.date ? new Date(exam.date).toLocaleDateString() : "TBD"}
                          {exam.venue ? ` · ${exam.venue}` : ""}
                        </td>
                        <td className="border border-border p-2 text-center font-mono">
                          {exam.totalMark} / <span className="font-bold text-emerald-700">{exam.passMark}</span>
                        </td>
                        <td className="border border-border p-2 text-center">
                          {exam.isPublished ? (
                            <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                              ✓ Published
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="border border-border p-2 text-right no-print">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant={exam.isPublished ? "secondary" : "primary"}
                              className="h-8 px-2 text-xs"
                              onClick={() => handleTogglePublish(exam)}
                            >
                              {exam.isPublished ? "Unpublish" : "Publish Online"}
                            </Button>
                            <Button
                              variant="secondary"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                setSelectedExamId(exam._id);
                                setActiveTab("results");
                              }}
                            >
                              Enter Marks
                            </Button>
                            <Button
                              variant="secondary"
                              className="h-8 px-2 text-xs"
                              onClick={() => openEditExam(exam)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 px-2 text-xs text-rose-600"
                              onClick={() => handleDeleteExam(exam._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPLICANT RESULTS */}
      {activeTab === "results" && (
        <div className="space-y-6">
          <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-white p-4">
            <div className="w-full sm:w-72">
              <Field label="Select Admission Exam">
                <Select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
                  <option value="">-- Choose Exam --</option>
                  {exams.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.name} ({ex.academicYear})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {selectedExamId && (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => setBulkDialogOpen(true)}>
                  📋 Bulk Paste Marks (CSV)
                </Button>
                <Button onClick={openAddResult}>+ Add Single Applicant Result</Button>
              </div>
            )}
          </div>

          {!selectedExamId ? (
            <EmptyState title="Select an admission exam" hint="Choose an exam from the dropdown above to view or enter candidate results." />
          ) : resultsLoading ? (
            <TableSkeleton />
          ) : (
            <div className="rounded-lg border border-border bg-white p-6 print:p-0 print:border-none">
              {/* Header */}
              <div className="mb-4 text-center">
                <h2 className="text-xl font-bold">{session?.data.settings?.name || "School Name"}</h2>
                <h3 className="text-base font-semibold text-primary">{currentExam?.name} — Result Sheet</h3>
                <p className="text-xs text-muted-foreground">
                  Academic Year: {currentExam?.academicYear} | Pass Mark: {currentExam?.passMark} / {currentExam?.totalMark} |{" "}
                  Status: {currentExam?.isPublished ? "Published Online" : "Draft (Not on website)"}
                </p>
                <div className="mt-2 flex justify-center gap-4 text-xs font-semibold">
                  <span className="text-foreground">Total Applicants: {results.length}</span>
                  <span className="text-emerald-700">Passed: {passCount}</span>
                  <span className="text-rose-700">Failed: {failCount}</span>
                </div>
              </div>

              {!results.length ? (
                <EmptyState title="No results recorded yet" hint="Click '+ Add Single Applicant Result' or 'Bulk Paste Marks' above." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-left text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-xs font-semibold uppercase">
                        <th className="border border-border p-2 text-center w-12">#</th>
                        <th className="border border-border p-2 font-mono">Roll No</th>
                        <th className="border border-border p-2">Applicant Name</th>
                        <th className="border border-border p-2">Phone</th>
                        <th className="border border-border p-2 text-center">Marks</th>
                        <th className="border border-border p-2 text-center">Status</th>
                        <th className="border border-border p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, idx) => (
                        <tr key={r._id} className="hover:bg-muted/20">
                          <td className="border border-border p-2 text-center font-mono text-xs">{idx + 1}</td>
                          <td className="border border-border p-2 font-mono font-bold">{r.roll}</td>
                          <td className="border border-border p-2 font-medium">
                            {r.applicantName}
                            {r.applicantNameBn && (
                              <span className="block text-xs text-muted-foreground">{r.applicantNameBn}</span>
                            )}
                          </td>
                          <td className="border border-border p-2 font-mono text-xs">{r.phone || "—"}</td>
                          <td className="border border-border p-2 text-center font-bold font-mono">{r.marks}</td>
                          <td className="border border-border p-2 text-center">
                            {r.status === "pass" ? (
                              <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                PASS (উত্তীর্ণ)
                              </span>
                            ) : (
                              <span className="inline-block rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                                FAIL (অনুত্তীর্ণ)
                              </span>
                            )}
                          </td>
                          <td className="border border-border p-2 text-xs text-muted-foreground">{r.notes || "—"}</td>
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

      {/* Exam Dialog */}
      <Dialog
        open={examDialogOpen}
        onClose={() => setExamDialogOpen(false)}
        title={editingExamId ? "Edit Admission Exam" : "New Admission Exam"}
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <Field label="Exam Name *">
            <Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Class 6 Admission Test 2026" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Academic Year *">
              <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required />
            </Field>
            <Field label="Target Class">
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">All / Open</option>
                {classesList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Exam Date">
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </Field>
            <Field label="Exam Venue">
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Main Hall, Campus 1" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Marks">
              <Input type="number" value={totalMark} onChange={(e) => setTotalMark(Number(e.target.value))} />
            </Field>
            <Field label="Pass Marks">
              <Input type="number" value={passMark} onChange={(e) => setPassMark(Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Description / Instructions">
            <Textarea value={examDesc} onChange={(e) => setExamDesc(e.target.value)} rows={2} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setExamDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingExam || isUpdatingExam}>
              {isCreatingExam || isUpdatingExam ? "Saving..." : "Save Exam"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Single Result Dialog */}
      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        title="Enter Applicant Result"
      >
        <form onSubmit={handleSaveResult} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Roll Number *">
              <Input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="e.g. 101" required />
            </Field>
            <Field label="Phone Number">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017xxxxxxxx" />
            </Field>
          </div>
          <Field label="Applicant Name *">
            <Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="Full Name" required />
          </Field>
          <Field label="Applicant Name (বাংলা)">
            <Input value={applicantNameBn} onChange={(e) => setApplicantNameBn(e.target.value)} placeholder="বাংলা নাম" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marks Obtained">
              <Input type="number" value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
            </Field>
            <Field label="Result Status">
              <Select value={resultStatus} onChange={(e) => setResultStatus(e.target.value as typeof resultStatus)}>
                <option value="pass">Pass (উত্তীর্ণ)</option>
                <option value="fail">Fail (অনুত্তীর্ণ)</option>
                <option value="pending">Pending</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes / Remarks">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setResultDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingResult}>
              {isSavingResult ? "Saving..." : "Save Result"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Bulk CSV Paste Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        title="Bulk Paste Applicant Results (CSV)"
      >
        <form onSubmit={handleBulkSave} className="space-y-4">
          <div className="rounded bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">CSV Format (One candidate per line):</p>
            <code className="block mt-1">Roll, Full Name, Marks, Phone</code>
            <p className="mt-1">Example: <code>1001, Tanvir Ahmed, 75, 01711000000</code></p>
          </div>
          <Field label="Paste CSV Content">
            <Textarea
              value={bulkCsv}
              onChange={(e) => setBulkCsv(e.target.value)}
              placeholder="1001, Tanvir Ahmed, 78, 01711000000&#10;1002, Nusrat Jahan, 82, 01811000000"
              rows={8}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingBulk}>
              {isSavingBulk ? "Processing..." : "Import & Save All"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
