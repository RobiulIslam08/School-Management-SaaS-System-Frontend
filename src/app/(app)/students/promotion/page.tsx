"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  GraduationCap,
  RotateCcw,
  Square,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/dialog";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  useGetClassesQuery,
  useGetSettingsQuery,
  useGetStudentsQuery,
  usePromoteStudentsMutation,
  useRevertStudentsPromotionMutation,
  useTransferOutStudentsMutation,
} from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { studentStatusTone } from "@/lib/status";
import { useI18n } from "@/lib/i18n";

type ClassItem = {
  _id: string;
  name: string;
  level?: number;
  sections?: unknown;
};

type StudentItem = {
  _id: string;
  studentId: string;
  rollNo?: string;
  name: string;
  nameBn?: string;
  photoUrl?: string;
  phone?: string;
  section?: string;
  academicYear?: string;
  status?: "pending" | "active" | "alumni" | "transferred";
  classId?: { _id?: string; name?: string };
  previousEnrollment?: {
    classId?: string;
    className?: string;
    section?: string;
    academicYear?: string;
    rollNo?: string;
    promotedAt?: string;
  };
};

function StudentPromotionInner() {
  const { t, locale } = useI18n();
  const bn = locale === "bn";
  const { data: settingsData } = useGetSettingsQuery();
  const schoolYear = settingsData?.data?.academicYear || String(new Date().getFullYear());

  // Source filters
  const [sourceYear, setSourceYear] = useState<string>("");
  const [sourceClassId, setSourceClassId] = useState<string>("");
  const [sourceSection, setSourceSection] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeYear = sourceYear || schoolYear;

  // Classes query
  const { data: classesData } = useGetClassesQuery();
  const classes = (classesData?.data ?? []) as ClassItem[];

  // Source sections list
  const sourceSections = useMemo(() => {
    if (!sourceClassId) return [];
    const cls = classes.find((c) => c._id === sourceClassId);
    return sectionNames(cls?.sections as never);
  }, [classes, sourceClassId]);

  // Students query
  const {
    data: studentsData,
    isLoading: studentsLoading,
    isError: studentsError,
    refetch: refetchStudents,
  } = useGetStudentsQuery(
    {
      academicYear: activeYear || undefined,
      classId: sourceClassId || undefined,
      section: sourceSection || undefined,
      status: statusFilter || undefined,
      q: searchQuery.trim() || undefined,
    },
    { skip: !sourceClassId }
  );

  const students = (studentsData?.data ?? []) as StudentItem[];

  // Selected students
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Promotion Modal / Target state
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [targetYear, setTargetYear] = useState<string>(
    String(Number(activeYear.slice(0, 4)) + 1 || new Date().getFullYear() + 1)
  );
  const [targetClassId, setTargetClassId] = useState<string>("");
  const [targetSection, setTargetSection] = useState<string>("A");

  // Transfer Out Modal state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferReason, setTransferReason] = useState("");
  const [removeFromClass, setRemoveFromClass] = useState(true);

  // Revert Modal state
  const [revertOpen, setRevertOpen] = useState(false);

  // Mutations
  const [promoteMutation, { isLoading: isPromoting }] = usePromoteStudentsMutation();
  const [revertMutation, { isLoading: isReverting }] = useRevertStudentsPromotionMutation();
  const [transferMutation, { isLoading: isTransferring }] = useTransferOutStudentsMutation();

  const targetSections = useMemo(() => {
    if (!targetClassId) return [];
    const cls = classes.find((c) => c._id === targetClassId);
    return sectionNames(cls?.sections as never);
  }, [classes, targetClassId]);

  // Selection helpers
  const allSelected = students.length > 0 && selectedIds.length === students.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s._id));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Handle Promote
  async function handlePromoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetClassId || !targetSection || !selectedIds.length) return;
    try {
      await promoteMutation({
        ids: selectedIds,
        targetClassId,
        targetSection,
        targetAcademicYear: targetYear || undefined,
      }).unwrap();
      toast.success(
        bn
          ? `${selectedIds.length} জন শিক্ষার্থীকে সফলভাবে প্রমোশন দেওয়া হয়েছে!`
          : `Successfully promoted ${selectedIds.length} students!`
      );
      setSelectedIds([]);
      setPromoteOpen(false);
      refetchStudents();
    } catch {
      toast.error(bn ? "প্রমোশন প্রক্রিয়াকরণে ব্যর্থ হয়েছে।" : "Failed to promote students.");
    }
  }

  // Handle Revert
  async function handleRevertSubmit() {
    if (!selectedIds.length) return;
    try {
      const res = await revertMutation({ ids: selectedIds }).unwrap();
      toast.success(
        bn
          ? `প্রমোশন পূর্বাবস্থায় ফিরিয়ে নেওয়া হয়েছে (${res.data?.revertedCount ?? selectedIds.length} জন)।`
          : `Promotion reverted for ${res.data?.revertedCount ?? selectedIds.length} students.`
      );
      setSelectedIds([]);
      setRevertOpen(false);
      refetchStudents();
    } catch {
      toast.error(bn ? "পূর্বাবস্থায় ফেরাতে সমস্যা হয়েছে।" : "Failed to revert promotion.");
    }
  }

  // Handle Transfer Out
  async function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIds.length) return;
    try {
      await transferMutation({
        ids: selectedIds,
        removeFromClass,
        reason: transferReason || (bn ? "অন্য স্কুলে ভর্তি / স্থানান্তর" : "Transferred to other school"),
      }).unwrap();
      toast.success(
        bn
          ? `${selectedIds.length} জন শিক্ষার্থীর ছাড়পত্র/স্থানান্তর সম্পন্ন হয়েছে।`
          : `${selectedIds.length} students marked transferred.`
      );
      setSelectedIds([]);
      setTransferOpen(false);
      setTransferReason("");
      refetchStudents();
    } catch {
      toast.error(bn ? "স্থানান্তর প্রক্রিয়ায় সমস্যা হয়েছে।" : "Failed to transfer students.");
    }
  }

  // Count previously promoted among selected
  const selectedPromotedCount = useMemo(() => {
    return students.filter((s) => selectedIds.includes(s._id) && s.previousEnrollment?.classId).length;
  }, [students, selectedIds]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={bn ? "শ্রেণি প্রমোশন ও ছাড়পত্র ব্যবস্থাপনা" : "Student Promotion & Transfer"}
        subtitle={
          bn
            ? "শ্রেণি ও শাখা ভিত্তিক শিক্ষার্থীদের পরবর্তী ক্লাসে উত্তীর্ণ করুন, ভুল প্রমোশন পূর্বাবস্থায় ফেরান অথবা ছাড়পত্র দিন।"
            : "Promote students to next class, revert accidental promotions, or issue transfer-outs."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/students">
              <Button variant="secondary">{bn ? "সকল শিক্ষার্থী তালিকা" : "All Students"}</Button>
            </Link>
          </div>
        }
      />

      {/* Filter / Fetch Criteria Bar */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-brand uppercase">
          {bn ? "১. শিক্ষার্থী খোঁজার শর্তাবলী (Select Cohort)" : "1. Select Cohort Criteria"}
        </h3>
        <FilterBar>
          <Field label={bn ? "শিক্ষাবর্ষ (Academic Year)" : "Academic Year"}>
            <Input
              value={activeYear}
              onChange={(e) => setSourceYear(e.target.value)}
              placeholder="e.g. 2026"
            />
          </Field>

          <Field label={bn ? "বর্তমান শ্রেণি (Class) *" : "Current Class *"}>
            <Select
              value={sourceClassId}
              onChange={(e) => {
                setSourceClassId(e.target.value);
                setSourceSection("");
                setSelectedIds([]);
              }}
            >
              <option value="">{bn ? "শ্রেণি নির্বাচন করুন" : "Select Class"}</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={bn ? "শাখা (Section)" : "Section"}>
            <Select
              value={sourceSection}
              onChange={(e) => {
                setSourceSection(e.target.value);
                setSelectedIds([]);
              }}
            >
              <option value="">{bn ? "সকল শাখা (All Sections)" : "All Sections"}</option>
              {sourceSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={bn ? "স্ট্যাটাস (Status)" : "Status"}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSelectedIds([]);
              }}
            >
              <option value="active">{bn ? "সক্রিয় শিক্ষার্থী (Active)" : "Active Students"}</option>
              <option value="">{bn ? "সব স্ট্যাটাস (All)" : "All Status"}</option>
              <option value="transferred">{bn ? "স্থানান্তরিত (Transferred)" : "Transferred"}</option>
              <option value="alumni">{bn ? "প্রাক্তন (Alumni)" : "Alumni"}</option>
            </Select>
          </Field>

          <Field label={bn ? "নাম বা আইডি দিয়ে সার্চ" : "Search Name or ID"}>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={bn ? "নাম বা আইডি..." : "Filter by name or ID..."}
            />
          </Field>
        </FilterBar>
      </div>

      {/* Main Roster & Action Toolbar */}
      {!sourceClassId ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h4 className="mt-4 text-base font-semibold text-foreground">
            {bn ? "প্রথমে একটি শ্রেণি নির্বাচন করুন" : "Please select a class first"}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {bn
              ? "উপরের ফিল্টার থেকে বর্তমান শ্রেণি সিলেক্ট করলেই সেই শ্রেণির শিক্ষার্থীদের তালিকা প্রদর্শিত হবে।"
              : "Select a class in the filter above to fetch and manage student promotions."}
          </p>
        </div>
      ) : studentsLoading ? (
        <TableSkeleton rows={8} />
      ) : studentsError ? (
        <QueryError onRetry={refetchStudents} />
      ) : students.length === 0 ? (
        <EmptyState
          title={bn ? "কোন শিক্ষার্থী পাওয়া যায়নি" : "No students found"}
          hint={
            bn
              ? "নির্বাচিত শিক্ষাবর্ষ ও শ্রেণির সাথে মেলানো কোনো ছাত্র-ছাত্রী পাওয়া যায়নি।"
              : "No students match the selected academic year, class, and section."
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 text-xs"
              >
                {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>
                  {allSelected
                    ? bn
                      ? "সব নির্বাচন বাতিল"
                      : "Deselect All"
                    : bn
                    ? "সবাইকে নির্বাচন করুন"
                    : "Select All"}
                </span>
              </Button>
              <span className="text-xs font-semibold text-muted-foreground">
                {bn
                  ? `মোট ${students.length} জন | নির্বাচিত: ${selectedIds.length} জন`
                  : `Total: ${students.length} | Selected: ${selectedIds.length}`}
              </span>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="primary"
                disabled={!selectedIds.length}
                onClick={() => setPromoteOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
              >
                <GraduationCap size={16} />
                <span>
                  {bn
                    ? `পরবর্তী ক্লাসে উত্তীর্ণ করুন (${selectedIds.length})`
                    : `Promote Selected (${selectedIds.length})`}
                </span>
                <ArrowRight size={14} />
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={!selectedIds.length}
                onClick={() => setRevertOpen(true)}
                className="flex items-center gap-1.5 border-transparent bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 hover:text-white"
                title={
                  bn
                    ? "পূর্বে প্রমোশনপ্রাপ্ত শিক্ষার্থীদের আগের ক্লাসে ফিরিয়ে নিন"
                    : "Revert selected promoted students back to previous class"
                }
              >
                <RotateCcw size={15} />
                <span>
                  {bn
                    ? `পূর্বাবস্থায় ফেরান (${selectedPromotedCount})`
                    : `Revert (${selectedPromotedCount})`}
                </span>
              </Button>

              <Button
                type="button"
                variant="danger"
                disabled={!selectedIds.length}
                onClick={() => setTransferOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
                title={
                  bn
                    ? "ফেল করা বা অন্য স্কুলে চলে যাওয়া শিক্ষার্থীদের ছাড়পত্র দিন"
                    : "Issue transfer out for dropouts or migrated students"
                }
              >
                <UserMinus size={15} />
                <span>
                  {bn
                    ? `ছাড়পত্র / বাদ দিন (${selectedIds.length})`
                    : `Transfer Out (${selectedIds.length})`}
                </span>
              </Button>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-12 px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                        aria-label="Select all students"
                      />
                    </th>
                    <th className="px-4 py-3.5">{bn ? "আইডি ও রোল" : "ID & Roll"}</th>
                    <th className="px-4 py-3.5">{bn ? "শিক্ষার্থীর নাম" : "Student Name"}</th>
                    <th className="px-4 py-3.5">{bn ? "বর্তমান শ্রেণি ও শাখা" : "Class & Section"}</th>
                    <th className="px-4 py-3.5">{bn ? "পূর্ববর্তী শ্রেণি রেকর্ড" : "Previous Enrollment"}</th>
                    <th className="px-4 py-3.5">{bn ? "স্ট্যাটাস" : "Status"}</th>
                    <th className="px-4 py-3.5 text-right">{bn ? "অ্যাকশন" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => {
                    const isSelected = selectedIds.includes(student._id);
                    const prev = student.previousEnrollment;
                    return (
                      <tr
                        key={student._id}
                        className={`transition-colors hover:bg-muted/30 ${
                          isSelected ? "bg-brand/5 dark:bg-brand/10" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(student._id)}
                            className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                            aria-label={`Select ${student.name}`}
                          />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-semibold text-foreground">{student.studentId}</div>
                          {student.rollNo ? (
                            <div className="text-xs text-muted-foreground">
                              {bn ? `রোল: ${student.rollNo}` : `Roll: ${student.rollNo}`}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {student.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={student.photoUrl}
                                alt=""
                                className="h-9 w-9 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 font-bold text-xs text-brand">
                                {student.name?.slice(0, 1) || "S"}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-foreground">
                                {bn && student.nameBn ? student.nameBn : student.name}
                              </div>
                              {student.nameBn && !bn ? (
                                <div className="text-xs text-muted-foreground">{student.nameBn}</div>
                              ) : null}
                              {student.phone ? (
                                <div className="text-xs text-muted-foreground">{student.phone}</div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-medium text-foreground">
                            {student.classId?.name || "—"} ({student.section || "A"})
                          </div>
                          <div className="text-xs text-muted-foreground">{student.academicYear || activeYear}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          {prev?.className || prev?.classId ? (
                            <div className="inline-flex flex-col gap-0.5 rounded-md border border-purple-200 bg-purple-50/70 px-2 py-1 text-xs text-purple-900 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                              <span className="font-semibold">
                                ⏪ {prev.className || (bn ? "আগের শ্রেণি" : "Prior Class")} ({prev.section || "A"})
                              </span>
                              <span className="text-[11px] opacity-80">
                                {prev.academicYear ? `${prev.academicYear}` : ""}
                                {prev.rollNo ? ` | ${bn ? "রোল:" : "Roll:"} ${prev.rollNo}` : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge
                            tone={studentStatusTone(student.status)}
                            label={
                              student.status === "transferred"
                                ? bn
                                  ? "স্থানান্তরিত"
                                  : "Transferred"
                                : student.status === "alumni"
                                ? bn
                                  ? "প্রাক্তন"
                                  : "Alumni"
                                : student.status === "pending"
                                ? bn
                                  ? "অপেক্ষমাণ"
                                  : "Pending"
                                : bn
                                ? "সক্রিয়"
                                : "Active"
                            }
                          />
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setSelectedIds([student._id]);
                                setPromoteOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs"
                            >
                              {bn ? "প্রমোশন" : "Promote"}
                            </Button>
                            {prev?.classId ? (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  setSelectedIds([student._id]);
                                  setRevertOpen(true);
                                }}
                                className="border-transparent bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 hover:text-white"
                                title={bn ? "পূর্ববর্তী ক্লাসে ফেরত" : "Revert"}
                              >
                                ↩ {bn ? "ফেরত" : "Revert"}
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Promote Students Dialog */}
      <Dialog
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        title={
          bn
            ? `পরবর্তী শ্রেণিতে উত্তীর্ণকরণ (${selectedIds.length} জন শিক্ষার্থী)`
            : `Promote ${selectedIds.length} Students`
        }
      >
        <form onSubmit={handlePromoteSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {bn
              ? "নির্বাচিত শিক্ষার্থীদের পরবর্তী ক্লাসে উত্তীর্ণ করার জন্য নিচের লক্ষ্য শিক্ষাবর্ষ, শ্রেণি ও শাখা নির্বাচন করুন।"
              : "Select the target academic year, class, and section to promote the selected students."}
          </p>

          <Field label={bn ? "লক্ষ্য শিক্ষাবর্ষ (Target Academic Year) *" : "Target Academic Year *"}>
            <Input
              required
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              placeholder="e.g. 2027"
            />
          </Field>

          <Field label={bn ? "পরবর্তী শ্রেণি (Target Class) *" : "Target Class *"}>
            <Select
              required
              value={targetClassId}
              onChange={(e) => {
                setTargetClassId(e.target.value);
                setTargetSection("A");
              }}
            >
              <option value="">{bn ? "পরবর্তী শ্রেণি বাছাই করুন" : "Select Target Class"}</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={bn ? "শাখা (Target Section) *" : "Target Section *"}>
            <Select
              required
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
            >
              {targetSections.length > 0 ? (
                targetSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))
              ) : (
                <>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </>
              )}
            </Select>
          </Field>

          <div className="rounded-lg border border-brand/20 bg-brand/5 p-3 text-xs text-brand">
            💡 {bn
              ? "প্রমোশন সম্পন্ন করার সময় শিক্ষার্থীদের বর্তমান ক্লাসের তথ্য স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে, যাতে প্রয়োজনে পরবর্তীতে পূর্বাবস্থায় ফিরিয়ে নেওয়া যায়।"
              : "Student previous class info will be safely recorded for rollback if needed."}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPromoteOpen(false)}>
              {bn ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPromoting || !targetClassId || !targetSection}
            >
              {isPromoting
                ? bn
                  ? "প্রমোশন হচ্ছে..."
                  : "Promoting..."
                : bn
                ? "প্রমোশন নিশ্চিত করুন"
                : "Confirm Promotion"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Revert Promotion Dialog */}
      <Dialog
        open={revertOpen}
        onClose={() => setRevertOpen(false)}
        title={bn ? "প্রমোশন পূর্বাবস্থায় ফিরিয়ে নিন (Rollback)" : "Revert Promotion"}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="text-sm text-amber-950">
              <p className="font-semibold">
                {bn
                  ? `নির্বাচিত ${selectedIds.length} জন শিক্ষার্থীর প্রমোশন বাতিল করে আগের ক্লাসে ফেরত নেবেন?`
                  : `Are you sure you want to revert promotion for ${selectedIds.length} selected students?`}
              </p>
              <p className="mt-1 text-xs text-amber-900">
                {bn
                  ? "যেসব শিক্ষার্থীর পূর্ববর্তী ক্লাসের রেকর্ড সংরক্ষিত আছে, তাদের সরাসরি সেই পূর্ববর্তী শ্রেণি, শাখা ও শিক্ষাবর্ষে স্থানান্তর করা হবে।"
                  : "Students with recorded previous enrollment will be restored to their prior class, section, and academic year."}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRevertOpen(false)}>
              {bn ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isReverting}
              onClick={handleRevertSubmit}
              className="border-amber-700 bg-amber-700 text-white hover:border-amber-800 hover:bg-amber-800 hover:text-white"
            >
              {isReverting
                ? bn
                  ? "ফেরত নেওয়া হচ্ছে..."
                  : "Reverting..."
                : bn
                ? "হ্যাঁ, পূর্বাবস্থায় ফেরান"
                : "Confirm Revert"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* MODAL 3: Transfer Out / Remove from Class Dialog */}
      <Dialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title={
          bn
            ? `শিক্ষার্থী ছাড়পত্র ও শ্রেণি থেকে বাদ (${selectedIds.length} জন)`
            : `Issue Transfer Out (${selectedIds.length} Students)`
        }
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {bn
              ? "যারা অন্য স্কুলে চলে গেছে বা ফেল করার কারণে ক্লাসে নেই, তাদের ছাড়পত্র (Transferred) হিসেবে চিহ্নিত করতে পারেন।"
              : "Mark students who have transferred out or left the institution."}
          </p>

          <Field label={bn ? "ছাড়পত্র / স্থানান্তরের কারণ" : "Reason for Transfer"}>
            <Input
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder={
                bn
                  ? "যেমন: অন্য স্কুলে ভর্তি, পরিবার স্থানান্তর ইত্যাদি"
                  : "e.g. Enrolled in another school, family relocation"
              }
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={removeFromClass}
              onChange={(e) => setRemoveFromClass(e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
            />
            <span>
              {bn
                ? "বর্তমান ক্লাসের তালিকা থেকে সরিয়ে দিন (Unassign from class)"
                : "Remove / unassign from current class roster"}
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setTransferOpen(false)}>
              {bn ? "বাতিল" : "Cancel"}
            </Button>
            <Button type="submit" variant="danger" disabled={isTransferring}>
              {isTransferring
                ? bn
                  ? "প্রক্রিয়াধীন..."
                  : "Processing..."
                : bn
                ? "ছাড়পত্র নিশ্চিত করুন"
                : "Confirm Transfer"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default function StudentPromotionPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <StudentPromotionInner />
    </Suspense>
  );
}
