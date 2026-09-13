"use client";

import { useEffect, useMemo, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { PageHeader } from "@/components/page-header";
import { QueryError, TableSkeleton, EmptyState } from "@/components/query-state";
import { Button, Field, Input, Select } from "@/components/ui";
import { useGetAttendanceQuery, useGetClassesQuery, useGetRosterQuery, useSaveAttendanceMutation } from "@/lib/api/schoolApi";
import { useGetAttendanceDatesQuery } from "@/lib/api/workspaceApi";
import { sectionNames } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const STATUSES = ["present", "absent", "late", "leave"] as const;

export default function AttendancePage() {
  const { t } = useI18n();
  const { data: classes } = useGetClassesQuery();
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("A");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(0);
  const { data, isLoading, isError, refetch } = useGetRosterQuery({ classId, section }, { skip: !classId });
  const { data: existing } = useGetAttendanceQuery({ classId, section, date }, { skip: !classId });
  const { data: dates } = useGetAttendanceDatesQuery({ classId, section }, { skip: !classId });
  const [save, { isLoading: saving }] = useSaveAttendanceMutation();
  const students = (data?.data ?? []) as Array<{ _id: string; name: string; studentId: string; rollNo?: string; photoUrl?: string }>;
  const [status, setStatus] = useState<Record<string, string>>({});
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const sections = useMemo(() => sectionNames(classList.find((item) => item._id === classId)?.sections as never), [classList, classId]);
  const recorded = new Set((dates?.data ?? []) as string[]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of (existing?.data ?? []) as Array<{ studentId?: { _id?: string } | string; status?: string }>) {
      const id = typeof row.studentId === "string" ? row.studentId : row.studentId?._id;
      if (id && row.status) next[id] = row.status;
    }
    setStatus(next);
  }, [existing, date, classId, section]);

  const visible = students.filter((item) => !q || `${item.name} ${item.studentId} ${item.rollNo ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const counts = useMemo(() => {
    const values = students.map((item) => status[item._id] ?? "present");
    return {
      present: values.filter((v) => v === "present").length,
      absent: values.filter((v) => v === "absent").length,
      late: values.filter((v) => v === "late").length,
      leave: values.filter((v) => v === "leave").length,
      total: values.length,
    };
  }, [students, status]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!visible.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocus((i) => Math.min(visible.length - 1, i + 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocus((i) => Math.max(0, i - 1));
      }
      const map: Record<string, string> = { p: "present", a: "absent", l: "late" };
      const next = map[event.key.toLowerCase()];
      if (next && visible[focus]) {
        setStatus((prev) => ({ ...prev, [visible[focus]._id]: next }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, focus]);

  return (
    <div>
      <PageHeader title={t.attendance.title} subtitle={t.attendance.subtitle} />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={t.common.class}>
          <Select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              const names = sectionNames(classList.find((item) => item._id === e.target.value)?.sections as never);
              setSection(names[0] ?? "A");
            }}
          >
            <option value="">{t.attendance.pickClass}</option>
            {classList.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t.common.section}>
          <Select value={section} onChange={(e) => setSection(e.target.value)}>
            {sections.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label={t.common.date}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t.common.search}>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.common.searchPlaceholder} />
        </Field>
        <Button
          disabled={!classId || !students.length || saving}
          onClick={async () => {
            const entries = students.map((student) => ({ studentId: student._id, status: status[student._id] ?? "present" }));
            const result = await save({ classId, section, date, entries });
            toastApiResult(result, t.attendance.saved, t.common.loadError);
          }}
        >
          {t.common.save}
        </Button>
      </div>
      {classId ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const iso = d.toISOString().slice(0, 10);
            return (
              <button
                key={iso}
                type="button"
                className={cn(
                  "h-11 rounded-md border px-3 text-xs",
                  iso === date ? "border-primary bg-primary/10" : "bg-white",
                  recorded.has(iso) && "ring-1 ring-emerald-500"
                )}
                onClick={() => setDate(iso)}
              >
                {iso.slice(5)} {recorded.has(iso) ? `· ${t.attendance.recorded}` : ""}
              </button>
            );
          })}
        </div>
      ) : null}
      {classId && students.length ? (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{t.common.present} {counts.present}</span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">{t.common.absent} {counts.absent}</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{t.common.late} {counts.late}</span>
          <span className="rounded-full bg-muted px-3 py-1">{t.common.leave} {counts.leave}/{counts.total}</span>
          <Button type="button" variant="secondary" className="h-9" onClick={() => setStatus(Object.fromEntries(students.map((s) => [s._id, "present"])))}>{t.attendance.markAllPresent}</Button>
          <Button type="button" variant="secondary" className="h-9" onClick={() => setStatus(Object.fromEntries(students.map((s) => [s._id, "absent"])))}>{t.attendance.markAllAbsent}</Button>
        </div>
      ) : null}
      {!classId ? <EmptyState title={t.attendance.pickClass} /> : null}
      {classId && isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {classId && !isLoading && !students.length ? <EmptyState title={t.attendance.emptyRoster} /> : null}
      <div className="space-y-2">
        {visible.map((student, index) => {
          const value = status[student._id] ?? "present";
          return (
            <div
              key={student._id}
              className={cn("flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3", index === focus && "ring-2 ring-primary")}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {student.photoUrl ? <img src={student.photoUrl} alt="" className="h-11 w-11 rounded-full object-cover" /> : student.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.studentId}{student.rollNo ? ` · ${student.rollNo}` : ""}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      "h-11 min-w-11 rounded-md px-3 text-xs font-medium",
                      item === "present" && (value === item ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800"),
                      item === "absent" && (value === item ? "bg-red-600 text-white" : "bg-red-50 text-red-800"),
                      item === "late" && (value === item ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-800"),
                      item === "leave" && (value === item ? "bg-stone-700 text-white" : "bg-muted text-muted-foreground")
                    )}
                    onClick={() => setStatus((prev) => ({ ...prev, [student._id]: item }))}
                  >
                    {item === "present" ? t.common.present : item === "absent" ? t.common.absent : item === "late" ? t.common.late : t.common.leave}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
