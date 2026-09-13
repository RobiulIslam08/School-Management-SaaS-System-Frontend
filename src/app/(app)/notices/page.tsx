"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useDeleteNoticeMutation, useUpdateNoticeMutation } from "@/lib/api/communicationApi";
import { useCreateNoticeMutation, useGetClassesQuery, useGetNoticesQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type NoticeRow = {
  _id: string;
  title: string;
  body: string;
  audience?: string;
  isPublished?: boolean;
  createdAt?: string;
  classId?: { _id?: string; name?: string } | string;
};

const emptyForm = { title: "", body: "", audience: "all", classId: "", isPublished: true };

export default function NoticesPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetNoticesQuery();
  const { data: classes } = useGetClassesQuery();
  const [createNotice] = useCreateNoticeMutation();
  const [updateNotice] = useUpdateNoticeMutation();
  const [deleteNotice] = useDeleteNoticeMutation();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<NoticeRow | null>(null);
  const [remove, setRemove] = useState<NoticeRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const rows = (data?.data ?? []) as NoticeRow[];
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string }>;
  const published = rows.filter((row) => row.isPublished !== false).length;

  function audienceLabel(value?: string) {
    if (value === "teachers") return t.notices.teachers;
    if (value === "students") return t.notices.students;
    if (value === "guardians") return t.notices.guardians;
    if (value === "class") return t.notices.class;
    return t.notices.all;
  }

  const editor = useMemo(() => edit ?? (open ? form : null), [edit, form, open]);

  return (
    <div>
      <PageHeader
        title={t.notices.title}
        subtitle={t.notices.subtitle}
        action={<Button onClick={() => { setForm(emptyForm); setEdit(null); setOpen(true); }}>{t.notices.newNotice}</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.notices.title} value={rows.length} icon={<Bell size={18} />} />
        <StatCard label={t.common.published} value={published} tone="success" />
        <StatCard label={t.common.draft} value={rows.length - published} tone="warning" />
      </div>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.notices.empty} hint={t.notices.emptyHint} /> : null}
      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row._id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{row.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{row.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {audienceLabel(row.audience)}
                  {typeof row.classId === "object" && row.classId.name ? ` · ${row.classId.name}` : ""}
                  {row.createdAt ? ` · ${new Date(row.createdAt).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={row.isPublished === false ? t.common.draft : t.common.published}
                  tone={row.isPublished === false ? "warning" : "success"}
                />
                <Button type="button" variant="secondary" className="h-9" onClick={() => {
                  setEdit(row);
                  setForm({
                    title: row.title,
                    body: row.body,
                    audience: row.audience ?? "all",
                    classId: typeof row.classId === "object" ? row.classId._id ?? "" : row.classId ?? "",
                    isPublished: row.isPublished !== false,
                  });
                  setOpen(true);
                }}>
                  {t.common.edit}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9"
                  onClick={async () => {
                    toastApiResult(await updateNotice({ id: row._id, isPublished: row.isPublished === false }), t.common.save, t.common.loadError);
                  }}
                >
                  {row.isPublished === false ? t.common.publish : t.common.draft}
                </Button>
                <Button type="button" variant="ghost" className="h-9" onClick={() => setRemove(row)}>
                  {t.common.delete}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Dialog open={open} title={edit ? t.common.edit : t.notices.newNotice} onClose={() => { setOpen(false); setEdit(null); }} className="max-w-xl">
        {editor ? (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const payload = { ...form, classId: form.audience === "class" ? form.classId : undefined };
              const result = edit
                ? await updateNotice({ id: edit._id, ...payload })
                : await createNotice(payload);
              if (toastApiResult(result, edit ? t.common.save : t.notices.publish, t.common.loadError)) {
                setOpen(false);
                setEdit(null);
              }
            }}
          >
            <Field label={t.notices.heading}><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
            <Field label={t.notices.body}><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field>
            <Field label={t.common.audience}>
              <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                <option value="all">{t.notices.all}</option>
                <option value="teachers">{t.notices.teachers}</option>
                <option value="students">{t.notices.students}</option>
                <option value="guardians">{t.notices.guardians}</option>
                <option value="class">{t.notices.class}</option>
              </Select>
            </Field>
            {form.audience === "class" ? (
              <Field label={t.common.class}>
                <Select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                  <option value="">{t.common.class}</option>
                  {classList.map((item) => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
              {t.common.publish}
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setOpen(false); setEdit(null); }}>{t.common.cancel}</Button>
              <Button type="submit">{edit ? t.common.save : t.notices.publish}</Button>
            </div>
          </form>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={Boolean(remove)}
        title={t.notices.deleteAsk}
        message={remove?.title ?? ""}
        danger
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          if (!remove) return;
          const result = await deleteNotice(remove._id);
          if (toastApiResult(result, t.common.delete, t.common.loadError)) setRemove(null);
        }}
      />
    </div>
  );
}
