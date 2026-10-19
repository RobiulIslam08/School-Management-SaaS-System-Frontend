"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  useGenerateSeatPlanMutation,
  useGetClassesQuery,
  useGetExamsQuery,
  useGetSeatPlanQuery,
  useMeQuery,
} from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { toastApiResult } from "@/lib/toast-api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function SeatPlanPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "slips">("grid");

  // Hall setup state
  const [hallsConfig, setHallsConfig] = useState<Array<{ name: string; rows: number; cols: number }>>([
    { name: "Room 101", rows: 5, cols: 6 },
  ]);

  const { data: examsData } = useGetExamsQuery();
  const { data: classesData } = useGetClassesQuery();
  const { data: planData, isLoading: planLoading, refetch } = useGetSeatPlanQuery(
    { examId, classId, section },
    { skip: !examId }
  );

  const [generatePlan, { isLoading: isGenerating }] = useGenerateSeatPlanMutation();

  const exams = (examsData?.data ?? []) as Array<{ _id: string; name: string }>;
  const classes = (classesData?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const plan = planData?.data as
    | {
        _id: string;
        examId: { _id: string; name: string; academicYear: string };
        halls: Array<{
          name: string;
          rows: number;
          cols: number;
          seats: Array<{
            seatNo: string;
            row: number;
            col: number;
            studentId?: string;
            studentName: string;
            studentSysId: string;
            rollNo: string;
          }>;
        }>;
      }
    | undefined;

  const currentExam = exams.find((e) => e._id === examId);
  const currentClass = classes.find((c) => c._id === classId);

  function addHall() {
    setHallsConfig((prev) => [
      ...prev,
      { name: `Room ${101 + prev.length}`, rows: 5, cols: 6 },
    ]);
  }

  function updateHall(index: number, key: "name" | "rows" | "cols", val: string | number) {
    setHallsConfig((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  }

  function removeHall(index: number) {
    setHallsConfig((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (!examId) {
      toast.error("Please select an exam first");
      return;
    }
    if (!hallsConfig.length) {
      toast.error("Please add at least one examination hall / room");
      return;
    }

    const res = await generatePlan({
      examId,
      classId: classId || undefined,
      section: section || undefined,
      halls: hallsConfig.map((h) => ({
        name: h.name.trim(),
        rows: Number(h.rows) || 1,
        cols: Number(h.cols) || 1,
      })),
    });

    toastApiResult(res, "Seat plan generated successfully!");
    refetch();
  }

  const totalAssignedStudents = useMemo(() => {
    if (!plan?.halls) return 0;
    return plan.halls.reduce((sum, h) => sum + h.seats.filter((s) => s.studentName).length, 0);
  }, [plan]);

  return (
    <div className="seat-plan-page space-y-6">
      <div className="no-print">
        <PageHeader
          title="Exam Seat Plan & Bench Slips (পরীক্ষার সিট প্লান)"
          subtitle="Generate room/bench seating layout for examinations, print notice charts & desk slips"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant={viewMode === "grid" ? "primary" : "secondary"}
                className="h-9 px-3 text-sm"
                onClick={() => setViewMode("grid")}
              >
                Room Grid View
              </Button>
              <Button
                variant={viewMode === "slips" ? "primary" : "secondary"}
                className="h-9 px-3 text-sm"
                onClick={() => setViewMode("slips")}
              >
                Bench Slips View
              </Button>
              <Button variant="secondary" disabled={!plan} onClick={() => window.print()}>
                {t.common.print}
              </Button>
            </div>
          }
        />

        {/* Filters and Config */}
        <div className="rounded-lg border border-border bg-white p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Examination *">
              <Select value={examId} onChange={(e) => setExamId(e.target.value)}>
                <option value="">-- Choose Exam --</option>
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Class (Optional filter)">
              <Select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSection("");
                }}
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Section (Optional filter)">
              <Select value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="">All Sections</option>
                {sectionNames(classes.find((c) => c._id === classId)?.sections as never).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Hall definition */}
          <div className="rounded-md border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Hall / Room Layout Configuration
              </h4>
              <Button variant="secondary" className="h-7 px-2 text-xs" onClick={addHall}>
                + Add Room
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hallsConfig.map((hall, idx) => (
                <div key={idx} className="rounded border border-border bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Hall {idx + 1}</span>
                    {hallsConfig.length > 1 && (
                      <button
                        type="button"
                        className="text-xs text-rose-600 hover:underline"
                        onClick={() => removeHall(idx)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <Input
                    value={hall.name}
                    onChange={(e) => updateHall(idx, "name", e.target.value)}
                    placeholder="Room Name / Number"
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Rows:</span>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={hall.rows}
                        onChange={(e) => updateHall(idx, "rows", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cols (Benches):</span>
                      <Input
                        type="number"
                        min={1}
                        max={15}
                        value={hall.cols}
                        onChange={(e) => updateHall(idx, "cols", Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    Total Seats: {hall.rows * hall.cols}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleGenerate} disabled={isGenerating || !examId}>
                {isGenerating ? "Generating Plan..." : "⚡ Generate Seat Allocation"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT VIEW */}
      {planLoading ? (
        <TableSkeleton />
      ) : !plan ? (
        <EmptyState
          title="No seat plan found for this exam"
          hint="Select an exam and click 'Generate Seat Allocation' above."
        />
      ) : (
        <div className="space-y-8">
          {/* Print Header */}
          <div className="hidden print:block text-center border-b pb-4">
            <h2 className="text-xl font-bold">{session?.data.settings?.name || "School Name"}</h2>
            <h3 className="text-base font-semibold">Examination Seating Arrangement</h3>
            <p className="text-xs text-muted-foreground">
              Exam: {plan.examId?.name || currentExam?.name} {currentClass ? `| Class: ${currentClass.name}` : ""}{" "}
              {section ? `| Section: ${section}` : ""} | Assigned Candidates: {totalAssignedStudents}
            </p>
          </div>

          {/* VIEW MODE 1: ROOM GRID VIEW */}
          {viewMode === "grid" && (
            <div className="space-y-6">
              {plan.halls.map((hall, hIdx) => (
                <div key={hIdx} className="rounded-lg border border-border bg-white p-5 print:p-0 print:border-none">
                  <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-primary">{hall.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Layout: {hall.rows} Rows × {hall.cols} Columns ({hall.rows * hall.cols} Seats)
                      </p>
                    </div>
                    <span className="text-xs font-semibold rounded bg-muted px-2 py-1">
                      Assigned: {hall.seats.filter((s) => s.studentName).length} / {hall.seats.length}
                    </span>
                  </div>

                  {/* Visual Grid */}
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${hall.cols}, minmax(110px, 1fr))`,
                    }}
                  >
                    {hall.seats.map((seat, sIdx) => (
                      <div
                        key={sIdx}
                        className={cn(
                          "rounded border p-2 text-center text-xs transition-colors min-h-[75px] flex flex-col justify-between",
                          seat.studentName
                            ? "border-emerald-300 bg-emerald-50/40"
                            : "border-dashed border-border bg-muted/10 text-muted-foreground"
                        )}
                      >
                        <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                          {seat.seatNo}
                        </div>
                        {seat.studentName ? (
                          <div className="my-1">
                            <div className="font-bold text-emerald-950 truncate" title={seat.studentName}>
                              {seat.studentName}
                            </div>
                            <div className="font-mono text-emerald-800 text-[11px] font-semibold">
                              Roll: {seat.rollNo || "—"}
                            </div>
                            <div className="font-mono text-[9px] text-muted-foreground">{seat.studentSysId}</div>
                          </div>
                        ) : (
                          <span className="text-[11px] italic">Vacant</span>
                        )}
                        <div className="text-[9px] text-muted-foreground">
                          R{seat.row} : C{seat.col}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE 2: BENCH SLIPS VIEW */}
          {viewMode === "slips" && (
            <div className="rounded-lg border border-border bg-white p-5 print:p-0 print:border-none space-y-4">
              <div className="no-print mb-2">
                <p className="text-xs text-muted-foreground">
                  Compact printable desk slips. Cut along dotted borders and paste on exam benches.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 print:grid-cols-3 print:gap-2">
                {plan.halls.flatMap((h) =>
                  h.seats
                    .filter((s) => s.studentName)
                    .map((seat, idx) => (
                      <div
                        key={`${h.name}-${idx}`}
                        className="rounded border border-dashed border-foreground/60 p-3 bg-white flex flex-col justify-between text-xs"
                      >
                        <div className="flex items-center justify-between border-b pb-1 text-[10px] font-bold uppercase text-muted-foreground">
                          <span>{h.name}</span>
                          <span className="font-mono text-primary font-black text-xs">{seat.seatNo}</span>
                        </div>
                        <div className="py-2 text-center">
                          <div className="text-sm font-bold text-foreground">{seat.studentName}</div>
                          <div className="mt-1 font-mono text-base font-black text-primary">
                            ROLL: {seat.rollNo || "—"}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">ID: {seat.studentSysId}</div>
                        </div>
                        <div className="border-t pt-1 text-center text-[9px] text-muted-foreground">
                          {plan.examId?.name || currentExam?.name}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
