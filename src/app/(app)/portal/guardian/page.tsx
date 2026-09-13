"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, Field, Select } from "@/components/ui";
import { useGetStudentsQuery, useGuardianPortalQuery, useMeQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type AttendanceRow = { _id?: string; date?: string; status?: string };
type NoticeRow = { _id: string; title: string; body?: string };

export default function GuardianPortalPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const role = session?.data.user.role;
  const { data: students } = useGetStudentsQuery(undefined, { skip: role === "guardian" || !role });
  const [studentId, setStudentId] = useState("");
  const { data, isLoading, isError, refetch } = useGuardianPortalQuery(
    role === "guardian" ? undefined : studentId || undefined,
    { skip: !role }
  );
  const list = (students?.data ?? []) as Array<{ _id: string; name: string; studentId: string }>;
  const payload = data?.data ?? {};
  const student = payload.student as { _id?: string; name?: string; studentId?: string; classId?: { name?: string } } | null;
  const results = (payload.results ?? []) as Array<{ gpa: number; letter: string; examTypeId?: { name?: string } }>;
  const fees = (payload.fees ?? []) as Array<{ title: string; status: string; dueAmount: number; paidAmount: number }>;
  const attendance = (payload.attendance ?? []) as AttendanceRow[];
  const notices = (payload.notices ?? []) as NoticeRow[];
  const present = attendance.filter((row) => row.status === "present").length;

  function markLabel(status?: string) {
    if (status === "absent") return t.common.absent;
    if (status === "late") return t.common.late;
    if (status === "leave") return t.common.leave;
    return t.common.present;
  }

  return (
    <div>
      <PageHeader
        title={t.portals.guardianTitle}
        subtitle={student ? `${student.name} · ${student.studentId}` : t.portals.guardianHint}
      />
      {role !== "guardian" ? (
        <div className="mb-4 max-w-sm">
          <Field label={t.common.student}>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">{t.common.student}</option>
              {list.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} · {item.studentId}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!studentId && !student ? <EmptyState title={t.portals.guardianHint} /> : null}
      {student ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={t.portals.results} value={results.length} />
            <StatCard label={t.portals.last30} value={`${present}/${attendance.length || 0}`} tone="success" />
            <StatCard label={t.portals.dues} value={fees.filter((row) => row.status !== "paid").length} tone="danger" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-semibold">{t.portals.results}</h2>
              {results.length ? (
                <DataTable
                  rows={results.map((row, i) => ({ ...row, id: String(i) }))}
                  rowKey={(row) => row.id}
                  columns={[
                    { header: t.nav.exams, cell: (row) => row.examTypeId?.name ?? "—" },
                    { header: t.results.gpa, cell: (row) => row.gpa, align: "right" },
                    { header: t.results.grade, cell: (row) => row.letter },
                  ]}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{t.portals.noResults}</p>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">{t.portals.dues}</h2>
              {fees.length ? (
                <DataTable
                  rows={fees.map((row, i) => ({ ...row, id: String(i) }))}
                  rowKey={(row) => row.id}
                  columns={[
                    { header: t.fees.titleField, cell: (row) => row.title },
                    { header: t.fees.paid, cell: (row) => `${row.paidAmount} / ${row.dueAmount}`, align: "right" },
                    { header: t.common.status, cell: (row) => row.status },
                  ]}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{t.portals.noFees}</p>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">{t.portals.attendance}</h2>
              {attendance.length ? (
                <ul className="space-y-2 text-sm">
                  {attendance.slice(0, 10).map((row, index) => (
                    <li key={row._id ?? String(index)} className="flex items-center justify-between">
                      <span>{row.date ? new Date(row.date).toLocaleDateString() : "—"}</span>
                      <StatusBadge
                        label={markLabel(row.status)}
                        tone={row.status === "absent" ? "danger" : row.status === "late" ? "warning" : "success"}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t.portals.noAttendance}</p>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">{t.portals.notices}</h2>
              {notices.length ? (
                <ul className="space-y-2 text-sm">
                  {notices.map((row) => (
                    <li key={row._id}>
                      <p className="font-medium">{row.title}</p>
                      {row.body ? <p className="text-muted-foreground">{row.body}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t.portals.noNotices}</p>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
