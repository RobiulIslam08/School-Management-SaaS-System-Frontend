"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { GraduationCap, UserPlus, Users } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { Dialog } from "@/components/dialog";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, Field, Select } from "@/components/ui";
import { useGetClassesQuery, useGetStudentsQuery, usePromoteStudentsMutation } from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { studentStatusTone } from "@/lib/status";
import { useI18n } from "@/lib/i18n";

type StudentRow = {
  _id: string;
  name: string;
  studentId: string;
  phone?: string;
  section?: string;
  status?: string;
  classId?: { name?: string };
};

function statusLabel(t: ReturnType<typeof useI18n>["t"], status?: string) {
  if (status === "pending") return t.common.pending;
  if (status === "alumni") return t.common.alumni;
  if (status === "transferred") return t.common.transferred;
  return t.common.active;
}

function StudentsInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const classId = params.get("classId") ?? "";
  const section = params.get("section") ?? "";
  const status = params.get("status") ?? "";
  const { data, isLoading, isError, refetch } = useGetStudentsQuery({
    q: params.get("q") ?? undefined,
    classId: classId || undefined,
    section: section || undefined,
    status: status || undefined,
  });

  function setFilters(next: { classId?: string; section?: string; status?: string }) {
    const search = new URLSearchParams();
    const nextClass = next.classId ?? classId;
    const nextSection = next.section ?? section;
    const nextStatus = next.status ?? status;
    if (nextClass) search.set("classId", nextClass);
    if (nextClass && nextSection) search.set("section", nextSection);
    if (nextStatus) search.set("status", nextStatus);
    const qs = search.toString();
    router.replace(qs ? `/students?${qs}` : "/students");
  }
  const { data: classes } = useGetClassesQuery();
  const [promote, { isLoading: promoting }] = usePromoteStudentsMutation();
  const [selected, setSelected] = useState<string[]>([]);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [targetClassId, setTargetClassId] = useState("");
  const [targetSection, setTargetSection] = useState("A");
  const rows = (data?.data ?? []) as StudentRow[];
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const filterSections = useMemo(
    () => sectionNames(classList.find((item) => item._id === classId)?.sections as never),
    [classList, classId]
  );
  const targetSections = useMemo(
    () => sectionNames(classList.find((item) => item._id === targetClassId)?.sections as never),
    [classList, targetClassId]
  );

  const counts = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((row) => row.status === "active" || !row.status).length,
      pending: rows.filter((row) => row.status === "pending").length,
    }),
    [rows]
  );

  return (
    <div>
      <PageHeader
        title={t.students.title}
        subtitle={t.students.subtitle}
        actions={
          <>
            <Button type="button" variant="secondary" disabled={!selected.length} onClick={() => setPromoteOpen(true)}>
              {t.students.promote} ({selected.length})
            </Button>
            <Link href="/students/admit">
              <Button>{t.students.admit}</Button>
            </Link>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard href="/students" label={t.students.title} value={counts.total} icon={<Users size={18} />} />
        <StatCard href="/students?status=active" label={t.common.active} value={counts.active} icon={<GraduationCap size={18} />} tone="success" />
        <StatCard href="/students/admit" label={t.common.pending} value={counts.pending} icon={<UserPlus size={18} />} tone="warning" />
      </div>
      <FilterBar>
        <Field label={t.common.class}>
          <Select
            value={classId}
            onChange={(e) => setFilters({ classId: e.target.value, section: "" })}
          >
            <option value="">{t.common.all}</option>
            {classList.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.common.section}>
          <Select value={section} onChange={(e) => setFilters({ section: e.target.value })} disabled={!classId}>
            <option value="">{t.common.all}</option>
            {filterSections.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.common.status}>
          <Select value={status} onChange={(e) => setFilters({ status: e.target.value })}>
            <option value="">{t.common.all}</option>
            <option value="active">{t.common.active}</option>
            <option value="pending">{t.common.pending}</option>
            <option value="alumni">{t.common.alumni}</option>
            <option value="transferred">{t.common.transferred}</option>
          </Select>
        </Field>
      </FilterBar>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? (
        <EmptyState
          title={t.students.empty}
          hint={t.students.emptyHint}
          action={
            <Link href="/students/admit">
              <Button>{t.students.admit}</Button>
            </Link>
          }
        />
      ) : null}
      <DataTable
        searchable
        pageSize={12}
        rows={rows}
        rowKey={(row) => row._id}
        selectedIds={selected}
        onToggle={(id) => setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))}
        columns={[
          { header: t.students.id, cell: (row) => row.studentId, sortValue: (row) => row.studentId },
          { header: t.common.name, cell: (row) => row.name, sortValue: (row) => row.name },
          {
            header: t.common.class,
            cell: (row) => `${row.classId?.name ?? "—"} ${row.section ?? ""}`.trim(),
            sortValue: (row) => `${row.classId?.name ?? ""} ${row.section ?? ""}`,
          },
          { header: t.common.phone, cell: (row) => row.phone || "—" },
          {
            header: t.common.status,
            cell: (row) => <StatusBadge label={statusLabel(t, row.status)} tone={studentStatusTone(row.status)} />,
            sortValue: (row) => row.status ?? "active",
          },
        ]}
        actions={(row) => [
          { label: t.common.view, onClick: () => router.push(`/students/${row._id}`) },
          { label: t.common.edit, onClick: () => router.push(`/students/${row._id}?edit=1`) },
        ]}
        mobileCard={(row) => (
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">
              {row.studentId} · {row.classId?.name} {row.section}
            </p>
          </div>
        )}
      />
      <Dialog open={promoteOpen} title={t.students.promote} onClose={() => setPromoteOpen(false)}>
        <p className="mb-4 text-sm text-muted-foreground">{t.students.promoteHint}</p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selected.length || !targetClassId) return;
            const result = await promote({ ids: selected, targetClassId, targetSection });
            if (toastApiResult(result, t.students.promote, t.common.loadError)) {
              setSelected([]);
              setPromoteOpen(false);
            }
          }}
        >
          <Field label={t.students.promoteClass}>
            <Select
              value={targetClassId}
              onChange={(e) => {
                setTargetClassId(e.target.value);
                const next = sectionNames(classList.find((item) => item._id === e.target.value)?.sections as never);
                setTargetSection(next[0] ?? "A");
              }}
            >
              <option value="">{t.students.promoteClass}</option>
              {classList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.common.section}>
            <Select value={targetSection} onChange={(e) => setTargetSection(e.target.value)}>
              {targetSections.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPromoteOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button disabled={promoting || !selected.length || !targetClassId} type="submit">
              {t.students.promote} ({selected.length})
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <StudentsInner />
    </Suspense>
  );
}
