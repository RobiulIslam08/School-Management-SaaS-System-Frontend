"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Select } from "@/components/ui";
import { useGetClassesQuery, useGetStudentsQuery, useMeQuery } from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type CardStudent = {
  _id: string;
  name: string;
  studentId: string;
  rollNo?: string;
  classId?: { name?: string };
  section?: string;
  photoUrl?: string;
};

export default function IdCardsPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const { data: classes } = useGetClassesQuery();
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const { data, isLoading, isError, refetch } = useGetStudentsQuery({
    status: "active",
    classId: classId || undefined,
    section: section || undefined,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const rows = (data?.data ?? []) as CardStudent[];
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const sections = useMemo(
    () => sectionNames(classList.find((item) => item._id === classId)?.sections as never),
    [classList, classId]
  );
  const settings = session?.data.settings;
  const printSet = selected.length ? rows.filter((row) => selected.includes(row._id)) : rows;

  return (
    <div>
      <PageHeader
        title={t.idCards.title}
        subtitle={t.idCards.subtitle}
        actions={
          rows.length ? (
            <Button className="no-print" variant="secondary" type="button" onClick={() => window.print()}>
              {selected.length ? t.idCards.printSelected : t.idCards.printAll}
            </Button>
          ) : null
        }
      />
      <div className="no-print">
        <FilterBar>
          <Field label={t.common.class}>
            <Select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSection("");
                setSelected([]);
              }}
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
            <Select value={section} onChange={(e) => setSection(e.target.value)} disabled={!classId}>
              <option value="">{t.common.all}</option>
              {sections.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
        </FilterBar>
        {isLoading ? <TableSkeleton /> : null}
        {isError ? <QueryError onRetry={refetch} /> : null}
        {!isLoading && !rows.length ? <EmptyState title={t.idCards.empty} /> : null}
        {rows.length ? (
          <DataTable
            searchable
            pageSize={12}
            rows={rows}
            rowKey={(row) => row._id}
            selectedIds={selected}
            onToggle={(id) => setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))}
            columns={[
              { header: t.common.name, cell: (row) => row.name, sortValue: (row) => row.name },
              { header: t.idCards.studentId, cell: (row) => row.studentId },
              { header: t.common.class, cell: (row) => `${row.classId?.name ?? ""} ${row.section ?? ""}`.trim() },
            ]}
          />
        ) : null}
      </div>
      <div className={cn("mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2", !printSet.length && "hidden")}>
        {printSet.map((row) => (
          <article key={row._id} className="marksheet-sheet flex overflow-hidden rounded-xl border-2 border-foreground bg-white">
            <div className="flex w-24 shrink-0 items-center justify-center border-r border-foreground bg-primary/10">
              {row.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-semibold text-primary">{row.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{settings?.name}</p>
              {settings?.eiin ? (
                <p className="text-[10px] text-muted-foreground">
                  {t.marksheets.eiin}: {settings.eiin}
                </p>
              ) : null}
              <h3 className="mt-2 truncate text-base font-semibold">{row.name}</h3>
              <p className="text-xs">
                {t.idCards.studentId}: <span className="font-medium">{row.studentId}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {row.classId?.name}
                {row.section ? ` · ${row.section}` : ""}
                {row.rollNo ? ` · ${t.marksheets.roll} ${row.rollNo}` : ""}
              </p>
              {settings?.academicYear ? (
                <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.common.year}: {settings.academicYear}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
