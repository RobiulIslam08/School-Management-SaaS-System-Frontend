"use client";

import { useMemo, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable, FormPanel } from "@/components/data-table";
import { ConfirmDialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input } from "@/components/ui";
import { ClassWorkspace } from "@/features/classes/class-workspace";
import { useArchiveClassMutation, useDeleteClassMutation, useUpdateClassMutation } from "@/lib/api/classApi";
import { useCreateClassMutation, useGetClassesQuery } from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";

type ClassRow = {
  _id: string;
  name: string;
  code: string;
  level: number;
  sortOrder?: number;
  sections?: Array<string | { name?: string }>;
  isActive?: boolean;
};

export default function ClassesPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetClassesQuery();
  const [createClass] = useCreateClassMutation();
  const [updateClass] = useUpdateClassMutation();
  const [archiveClass] = useArchiveClassMutation();
  const [deleteClass] = useDeleteClassMutation();
  const [form, setForm] = useState({ name: "", sections: "A,B" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; mode: "delete" | "archive" } | null>(null);
  const rows = (data?.data ?? []) as ClassRow[];
  const openRow = rows.find((row) => row._id === openId);

  const visible = useMemo(() => rows.filter((row) => row.isActive !== false), [rows]);
  const nextLevel = useMemo(() => {
    const max = visible.reduce((acc, row) => Math.max(acc, row.sortOrder ?? row.level ?? 0), 0);
    return max + 1;
  }, [visible]);

  return (
    <div>
      <PageHeader title={t.classes.title} subtitle={t.classes.subtitle} />
      <FormPanel
        className="md:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const code =
            form.name
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
              .slice(0, 24) || `CLASS-${nextLevel}`;
          const result = await createClass({
            name: form.name,
            code,
            level: nextLevel,
            sortOrder: nextLevel,
            sections: form.sections.split(",").map((item) => item.trim()).filter(Boolean),
          });
          if (toastApiResult(result, t.common.add, t.common.loadError)) {
            setForm({ name: "", sections: "A,B" });
          }
        }}
      >
        <Field label={t.classes.nameLabel}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label={t.classes.sections}><Input value={form.sections} onChange={(e) => setForm({ ...form, sections: e.target.value })} /></Field>
        <Button type="submit">{t.common.add}</Button>
      </FormPanel>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !visible.length ? <EmptyState title={t.classes.empty} hint={t.classes.emptyHint} /> : null}
      <DataTable
        searchable
        pageSize={12}
        rows={visible}
        rowKey={(row) => row._id}
        columns={[
          { header: t.classes.nameLabel, cell: (row) => row.name, sortValue: (row) => row.name },
          { header: t.classes.sections, cell: (row) => sectionNames(row.sections).join(", ") },
        ]}
        actions={(row) => [
          { label: t.classes.manage, onClick: () => setOpenId(row._id) },
          { label: t.common.edit, onClick: async () => toastApiResult(await updateClass({ id: row._id, name: row.name }), t.common.save) },
          { label: t.common.archive, onClick: () => setConfirm({ id: row._id, mode: "archive" }) },
          { label: t.common.delete, danger: true, onClick: () => setConfirm({ id: row._id, mode: "delete" }) },
        ]}
        mobileCard={(row) => (
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{sectionNames(row.sections).join(", ")}</p>
          </div>
        )}
      />
      {openRow ? <ClassWorkspace classId={openRow._id} className={openRow.name} onClose={() => setOpenId(null)} /> : null}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.mode === "delete" ? t.common.delete : t.common.archive}
        message={confirm?.mode === "delete" ? t.classes.deleteAsk : t.classes.archiveAsk}
        danger={confirm?.mode === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const result = confirm.mode === "delete" ? await deleteClass(confirm.id) : await archiveClass(confirm.id);
          toastApiResult(result, t.common.save, t.classes.deleteWarn);
          setConfirm(null);
        }}
      />
    </div>
  );
}
