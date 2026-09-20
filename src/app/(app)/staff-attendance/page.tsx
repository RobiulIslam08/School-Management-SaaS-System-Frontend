"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
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

export default function StaffAttendancePage() {
  const { t } = useI18n();
  const today = toLocalYmd();
  const [date, setDate] = useState(today);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [focus, setFocus] = useState(0);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [baseline, setBaseline] = useState<Record<string, string>>({});

  const { data: rosterData, isLoading, isError, refetch } = useGetStaffRosterQuery();
  const { data: existing } = useGetStaffAttendanceQuery({ date });
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
    <div>
      <PageHeader title={t.staffAttendance.title} subtitle={t.staffAttendance.subtitle} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={t.staffAttendance.totalStaff} value={counts.total} icon={<Users size={18} />} />
        <StatCard label={t.staffAttendance.present} value={counts.present} tone="success" />
        <StatCard label={t.staffAttendance.absent} value={counts.absent} tone="danger" />
        <StatCard label={t.staffAttendance.late} value={counts.late} tone="warning" />
        <StatCard label={t.staffAttendance.leave} value={counts.leave} />
      </div>

      <div className="mb-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-end">
          <div className="flex flex-wrap items-end gap-2">
            <Button type="button" variant="secondary" className="h-10 px-2" onClick={() => setDate(shiftDate(date, -1))}>
              <ChevronLeft size={16} />
              <span className="sr-only">{t.staffAttendance.prevDay}</span>
            </Button>
            <Field label={t.common.date}>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Button type="button" variant="secondary" className="h-10 px-2" onClick={() => setDate(shiftDate(date, 1))}>
              <ChevronRight size={16} />
              <span className="sr-only">{t.staffAttendance.nextDay}</span>
            </Button>
            <Button type="button" variant="ghost" className="h-10" onClick={() => setDate(today)}>
              {t.staffAttendance.today}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="flex flex-wrap gap-2">
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
                  "h-10 rounded-md border px-3 text-xs",
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
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm",
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
  );
}
