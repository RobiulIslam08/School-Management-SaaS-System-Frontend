"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { useGetAreaReportQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type AreaRow = {
  _id: { division?: string; district?: string; upazila?: string; area?: string };
  count: number;
};

export default function AreaReportPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetAreaReportQuery();
  const rows = (data?.data ?? []) as AreaRow[];
  const total = useMemo(() => rows.reduce((sum, row) => sum + row.count, 0), [rows]);
  const max = Math.max(...rows.map((row) => row.count), 1);
  const districts = new Set(rows.map((row) => row._id.district).filter(Boolean)).size;

  if (isLoading) return <TableSkeleton />;
  if (isError) return <QueryError onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={t.reports.title} subtitle={t.reports.subtitle} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard href="/students" label={t.reports.total} value={total} icon={<MapPin size={18} />} />
        <StatCard label={t.reports.district} value={districts} />
        <StatCard label={t.reports.area} value={rows.length} />
      </div>
      {!rows.length ? (
        <EmptyState title={t.reports.empty} hint={t.reports.emptyHint} />
      ) : (
        <DataTable
          searchable
          pageSize={16}
          rows={rows}
          rowKey={(row) => `${row._id.division}|${row._id.district}|${row._id.upazila}|${row._id.area}|${row.count}`}
          columns={[
            { header: t.reports.division, cell: (row) => row._id.division || "—", sortValue: (row) => row._id.division ?? "" },
            { header: t.reports.district, cell: (row) => row._id.district || "—", sortValue: (row) => row._id.district ?? "" },
            { header: t.reports.upazila, cell: (row) => row._id.upazila || "—" },
            { header: t.reports.area, cell: (row) => row._id.area || "—" },
            {
              header: t.reports.count,
              cell: (row) => (
                <div className="min-w-32">
                  <p className="tabular-nums">{row.count}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${Math.round((row.count / max) * 100)}%` }} />
                  </div>
                </div>
              ),
              align: "right",
              sortValue: (row) => row.count,
            },
          ]}
        />
      )}
    </div>
  );
}
