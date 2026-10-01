"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Users } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { StaffAttendanceRegister, type RegisterMark } from "@/components/staff-attendance-register";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  useGetStaffAttendanceDatesQuery,
  useGetStaffAttendanceQuery,
  useGetStaffRosterQuery,
  useSaveStaffAttendanceMutation,
} from "@/lib/api/financeApi";
import { useMeQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { cn, toLocalYmd } from "@/lib/utils";

const STATUSES = ["present", "absent", "late", "leave"] as const;

type StaffMember = {
  _id: string;
  name: string;
  staffId?: string;
  designation?: string;
  photoUrl?: string;
};

function shiftDate(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalYmd(date);
}

function monthBounds(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}

function yearBounds(iso: string) {
  const y = iso.slice(0, 4);
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

export default function StaffAttendancePage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const today = toLocalYmd();
  const [date, setDate] = useState(today);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [focus, setFocus] = useState(0);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [report, setReport] = useState<null | { kind: "month" | "year"; from: string; to: string }>(null);
  const reportAnchor = useRef<HTMLDivElement>(null);

  const { data: rosterData, isLoading, isError, refetch } = useGetStaffRosterQuery();
  const { data: existing } = useGetStaffAttendanceQuery({ date });
  const {
    data: reportData,
    isFetching: reportLoading,
    isError: reportError,
    refetch: refetchReport,
  } = useGetStaffAttendanceQuery(
    { from: report?.from ?? "", to: report?.to ?? "" },
    { skip: !report }
  );
  const { data: dates } = useGetStaffAttendanceDatesQuery();
  const [save, { isLoading: saving }] = useSaveStaffAttendanceMutation();

  const staff = (rosterData?.data ?? []) as StaffMember[];
  const recorded = new Set((dates?.data ?? []) as string[]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of (existing?.data ?? []) as Array<{
      teacherId?: { _id?: string } | string;
      status?: string;
    }>) {
      const id = typeof row.teacherId === "string" ? row.teacherId : row.teacherId?._id;
      if (id && row.status) next[id] = row.status;
    }
    setStatus(next);
    setBaseline(next);
    setFocus(0);
  }, [existing, date]);

  const dirty = useMemo(() => {
    const ids = new Set([...Object.keys(status), ...Object.keys(baseline), ...staff.map((s) => s._id)]);
    for (const id of ids) {
      const current = status[id] ?? "present";
      const saved = baseline[id];
      if (saved === undefined) {
        if (current !== "present") return true;
        continue;
      }
      if (current !== saved) return true;
    }
    return false;
  }, [status, baseline, staff]);

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return staff.filter((item) => {
      const current = status[item._id] ?? "present";
      if (statusFilter && current !== statusFilter) return false;
      if (!query) return true;
      return `${item.name} ${item.staffId ?? ""} ${item.designation ?? ""}`
        .toLowerCase()
        .includes(query);
    });
  }, [staff, q, status, statusFilter]);

  const counts = useMemo(() => {
    const values = staff.map((item) => status[item._id] ?? "present");
    return {
      present: values.filter((v) => v === "present").length,
      absent: values.filter((v) => v === "absent").length,
      late: values.filter((v) => v === "late").length,
      leave: values.filter((v) => v === "leave").length,
      total: values.length,
    };
  }, [staff, status]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (!visible.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocus((i) => Math.min(visible.length - 1, i + 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocus((i) => Math.max(0, i - 1));
      }
      const map: Record<string, string> = { p: "present", a: "absent", l: "late", e: "leave" };
      const next = map[event.key.toLowerCase()];
      if (next && visible[focus]) {
        setStatus((prev) => ({ ...prev, [visible[focus]._id]: next }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, focus]);

  const statusLabel = (value: string) => {
    if (value === "present") return t.staffAttendance.present;
    if (value === "absent") return t.staffAttendance.absent;
    if (value === "late") return t.staffAttendance.late;
    return t.staffAttendance.leave;
  };

  useEffect(() => {
    if (!report) return;
    reportAnchor.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [report, reportLoading]);

  async function handleSave() {
    const entries = staff.map((item) => ({
      teacherId: item._id,
      status: status[item._id] ?? "present",
    }));
    const result = await save({ date, entries });
    if (toastApiResult(result, t.staffAttendance.saved, t.common.loadError)) {
      const next = Object.fromEntries(entries.map((e) => [e.teacherId, e.status]));
      setBaseline(next);
    }
  }

  return (
    <div className="staff-attendance-page">
      <div className="no-print">
      <PageHeader title={t.staffAttendance.title} subtitle={t.staffAttendance.subtitle} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={t.staffAttendance.totalStaff} value={counts.total} icon={<Users size={18} />} />
        <StatCard label={t.staffAttendance.present} value={counts.present} tone="success" />
        <StatCard label={t.staffAttendance.absent} value={counts.absent} tone="danger" />
        <StatCard label={t.staffAttendance.late} value={counts.late} tone="warning" />
        <StatCard label={t.staffAttendance.leave} value={counts.leave} />
      </div>

      <div className="mb-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full min-w-0 flex-wrap items-end gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="w-11 px-0" onClick={() => setDate(shiftDate(date, -1))}>
              <ChevronLeft size={16} />
              <span className="sr-only">{t.staffAttendance.prevDay}</span>
            </Button>
            <Field label={t.common.date}>
              <Input type="date" className="w-[min(100%,11.5rem)]" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Button type="button" variant="secondary" className="w-11 px-0" onClick={() => setDate(shiftDate(date, 1))}>
              <ChevronRight size={16} />
              <span className="sr-only">{t.staffAttendance.nextDay}</span>
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDate(today)}>
              {t.staffAttendance.today}
            </Button>
          </div>
          <div className="grid min-w-[16rem] flex-1 gap-3 sm:grid-cols-2">
            <Field label={t.common.search}>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.common.searchPlaceholder}
              />
            </Field>
            <Field label={t.staffAttendance.filterStatus}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">{t.common.all}</option>
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel(value)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setReport({ kind: "month", ...monthBounds(date) })}
          >
            <Download size={14} className="mr-1.5" />
            {t.staffAttendance.monthlyPdf}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setReport({ kind: "year", ...yearBounds(date) })}
          >
            <Download size={14} className="mr-1.5" />
            {t.staffAttendance.yearlyPdf}
          </Button>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const next: Record<string, string> = {};
              for (const item of staff) next[item._id] = "present";
              setStatus(next);
            }}
          >
            {t.staffAttendance.markAllPresent}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const next: Record<string, string> = {};
              for (const item of staff) next[item._id] = "absent";
              setStatus(next);
            }}
          >
            {t.staffAttendance.markAllAbsent}
          </Button>
          <Button disabled={!staff.length || saving} onClick={handleSave}>
            {t.staffAttendance.save}
            {dirty ? ` · ${t.staffAttendance.dirty}` : ""}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const iso = toLocalYmd(d);
            return (
              <button
                key={iso}
                type="button"
                className={cn(
                  "h-11 rounded-md border px-3 text-xs",
                  iso === date ? "border-primary bg-primary/10 font-medium" : "bg-white",
                  recorded.has(iso) && "ring-1 ring-emerald-500"
                )}
                onClick={() => setDate(iso)}
              >
                {iso.slice(5)}
                {recorded.has(iso) ? ` · ${t.attendance.recorded}` : ""}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t.staffAttendance.keyboardHint}</p>
      </div>

      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !staff.length ? <EmptyState title={t.staffAttendance.empty} /> : null}
      {!isLoading && staff.length && !visible.length ? (
        <EmptyState title={t.staffAttendance.noMatch} />
      ) : null}

      <div className="space-y-2">
        {visible.map((item, index) => {
          const current = status[item._id] ?? "present";
          return (
            <div
              key={item._id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
                focus === index && "ring-2 ring-primary"
              )}
              onClick={() => setFocus(index)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-sm font-semibold text-primary">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{item.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[item.staffId, item.designation].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "h-11 min-w-11 rounded-md px-3 text-xs font-medium transition",
                      value === "present" &&
                        (current === value ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800"),
                      value === "absent" &&
                        (current === value ? "bg-red-600 text-white" : "bg-red-50 text-red-800"),
                      value === "late" &&
                        (current === value ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-800"),
                      value === "leave" &&
                        (current === value ? "bg-stone-700 text-white" : "bg-muted text-muted-foreground")
                    )}
                    onClick={() => setStatus((prev) => ({ ...prev, [item._id]: value }))}
                  >
                    {statusLabel(value)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {report ? (
        <div ref={reportAnchor} className="mt-8 scroll-mt-20">
          <div className="no-print mb-4 flex justify-end gap-2">
            <Button type="button" onClick={() => window.print()} disabled={reportLoading || reportError}>
              <Download size={16} className="mr-1.5" />
              {t.common.print}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setReport(null)}>
              {t.common.close}
            </Button>
          </div>
          {reportLoading ? <TableSkeleton /> : null}
          {reportError ? <QueryError onRetry={refetchReport} /> : null}
          {!reportLoading && !reportError ? (
            <StaffAttendanceRegister
              kind={report.kind}
              from={report.from}
              to={report.to}
              staff={(rosterData?.data ?? []) as StaffMember[]}
              marks={(reportData?.data ?? []) as RegisterMark[]}
              settings={session?.data.settings}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
