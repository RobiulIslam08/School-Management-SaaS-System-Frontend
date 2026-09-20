"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { IdCardDocument, type IdCardStudent } from "@/components/id-card-document";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Select } from "@/components/ui";
import { useGetClassesQuery, useGetStudentsQuery, useMeQuery } from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";

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
  const rows = (data?.data ?? []) as IdCardStudent[];
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const sections = useMemo(
    () => sectionNames(classList.find((item) => item._id === classId)?.sections as never),
    [classList, classId]
  );
  const settings = session?.data.settings;
  const printSet = selected.length ? rows.filter((row) => selected.includes(row._id)) : rows;

  return (
    <div className="id-cards-page">
      <div className="no-print">
        <PageHeader
          title={t.idCards.title}
          subtitle={t.idCards.subtitle}
          actions={
            rows.length ? (
              <Button variant="secondary" type="button" onClick={() => window.print()}>
                {selected.length ? t.idCards.printSelected : t.idCards.printAll}
              </Button>
            ) : null
          }
        />
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
            onToggle={(id) =>
              setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
            }
            columns={[
              { header: t.common.name, cell: (row) => row.name, sortValue: (row) => row.name },
              { header: t.idCards.studentId, cell: (row) => row.studentId },
              { header: t.common.class, cell: (row) => `${row.classId?.name ?? ""} ${row.section ?? ""}`.trim() },
            ]}
          />
        ) : null}
        {printSet.length ? (
          <h2 className="mb-3 mt-8 text-lg font-semibold">{t.idCards.preview}</h2>
        ) : null}
      </div>

      <div className={`mt-2 space-y-6 ${!printSet.length ? "hidden" : ""}`}>
        {printSet.map((row) => (
          <IdCardDocument key={row._id} student={row} settings={settings} />
        ))}
      </div>
    </div>
  );
}
