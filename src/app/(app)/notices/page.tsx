"use client";

import { useMemo, useState } from "react";
import { Bell, Pin, Globe, Printer } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { NoticeDocument } from "@/components/notice-document";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useDeleteNoticeMutation, useUpdateNoticeMutation } from "@/lib/api/communicationApi";
import {
  useCreateNoticeMutation,
  useGetClassesQuery,
  useGetNoticesQuery,
  useGetSettingsQuery,
} from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type NoticeSignatory = { name: string; designation: string };

type NoticeRow = {
  _id: string;
  title: string;
  body: string;
  audience?: string;
  isPublished?: boolean;
  createdAt?: string;
  refNo?: string;
  issueDate?: string;
  category?: string;
  signatories?: NoticeSignatory[];
  showOnWebsite?: boolean;
  pinned?: boolean;
  createdByName?: string;
  classId?: { _id?: string; name?: string } | string;
};

const emptySignatories: NoticeSignatory[] = [
  { name: "", designation: "প্রধান শিক্ষক" },
  { name: "", designation: "সহকারী প্রধান শিক্ষক" },
];

const emptyForm = {
  title: "",
  body: "",
  audience: "all",
  classId: "",
  isPublished: true,
  refNo: "",
  issueDate: new Date().toISOString().slice(0, 10),
  category: "general",
  signatories: emptySignatories,
  showOnWebsite: true,
  pinned: false,
};

export default function NoticesPage() {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError, refetch } = useGetNoticesQuery({
    status: status || undefined,
    audience: audienceFilter || undefined,
    category: categoryFilter || undefined,
    q: q || undefined,
  });
  const { data: classes } = useGetClassesQuery();
  const { data: settingsData } = useGetSettingsQuery();
  const [createNotice] = useCreateNoticeMutation();
  const [updateNotice] = useUpdateNoticeMutation();
  const [deleteNotice] = useDeleteNoticeMutation();

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<NoticeRow | null>(null);
  const [edit, setEdit] = useState<NoticeRow | null>(null);
  const [remove, setRemove] = useState<NoticeRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const rows = (data?.data ?? []) as NoticeRow[];
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string }>;
  const settings = settingsData?.data;
  const published = rows.filter((row) => row.isPublished !== false).length;

  function audienceLabel(value?: string) {
    if (value === "teachers") return t.notices.teachers;
    if (value === "students") return t.notices.students;
    if (value === "guardians") return t.notices.guardians;
    if (value === "class") return t.notices.class;
    return t.notices.all;
  }

  function categoryLabel(value?: string) {
    if (value === "exam") return t.notices.categoryExam;
    if (value === "holiday") return t.notices.categoryHoliday;
    if (value === "fee") return t.notices.categoryFee;
    if (value === "admission") return t.notices.categoryAdmission;
    if (value === "other") return t.notices.categoryOther;
    return t.notices.categoryGeneral;
  }

  function openCreate() {
    setForm({
      ...emptyForm,
      issueDate: new Date().toISOString().slice(0, 10),
      signatories: emptySignatories.map((s) => ({ ...s })),
    });
    setEdit(null);
    setOpen(true);
  }

  function openEdit(row: NoticeRow) {
    setEdit(row);
    setForm({
      title: row.title,
      body: row.body,
      audience: row.audience ?? "all",
      classId: typeof row.classId === "object" ? row.classId._id ?? "" : row.classId ?? "",
      isPublished: row.isPublished !== false,
      refNo: row.refNo ?? "",
      issueDate: row.issueDate
        ? new Date(row.issueDate).toISOString().slice(0, 10)
        : row.createdAt
          ? new Date(row.createdAt).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      category: row.category ?? "general",
      signatories:
        row.signatories?.length
          ? row.signatories.map((s) => ({ name: s.name ?? "", designation: s.designation ?? "" }))
          : emptySignatories.map((s) => ({ ...s })),
      showOnWebsite: row.showOnWebsite ?? false,
      pinned: row.pinned ?? false,
    });
    setOpen(true);
  }

  const previewData = useMemo(() => {
    if (open) {
      return {
        title: form.title,
        body: form.body,
        refNo: form.refNo || (edit?.refNo ?? "NOT-…"),
        issueDate: form.issueDate,
        category: form.category,
        signatories: form.signatories,
        createdByName: edit?.createdByName,
        pinned: form.pinned,
      };
    }
    if (preview) {
      return {
        title: preview.title,
        body: preview.body,
        refNo: preview.refNo,
        issueDate: preview.issueDate || preview.createdAt,
        category: preview.category,
        signatories: preview.signatories,
        createdByName: preview.createdByName,
        pinned: preview.pinned,
      };
    }
    return null;
  }, [open, form, edit, preview]);

  function updateSignatory(index: number, patch: Partial<NoticeSignatory>) {
    setForm((prev) => ({
      ...prev,
      signatories: prev.signatories.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  return (
    <div className="notices-page">
      <div className="no-print">
        <PageHeader
          title={t.notices.title}
          subtitle={t.notices.subtitle}
          action={<Button onClick={openCreate}>{t.notices.newNotice}</Button>}
        />
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label={t.notices.title} value={rows.length} icon={<Bell size={18} />} />
          <StatCard label={t.common.published} value={published} tone="success" />
          <StatCard label={t.common.draft} value={rows.length - published} tone="warning" />
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-white p-4">
          <Field label={t.notices.search}>
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.notices.search}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setQ(searchInput.trim());
                }}
              />
              <Button type="button" variant="secondary" onClick={() => setQ(searchInput.trim())}>
                {t.common.search}
              </Button>
            </div>
          </Field>
          <Field label={t.common.status}>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{t.notices.statusAll}</option>
              <option value="published">{t.common.published}</option>
              <option value="draft">{t.common.draft}</option>
            </Select>
          </Field>
          <Field label={t.common.audience}>
            <Select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)}>
              <option value="">{t.common.all}</option>
              <option value="all">{t.notices.all}</option>
              <option value="teachers">{t.notices.teachers}</option>
              <option value="students">{t.notices.students}</option>
              <option value="guardians">{t.notices.guardians}</option>
              <option value="class">{t.notices.class}</option>
            </Select>
          </Field>
          <Field label={t.notices.category}>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">{t.notices.category}</option>
              <option value="general">{t.notices.categoryGeneral}</option>
              <option value="exam">{t.notices.categoryExam}</option>
              <option value="holiday">{t.notices.categoryHoliday}</option>
              <option value="fee">{t.notices.categoryFee}</option>
              <option value="admission">{t.notices.categoryAdmission}</option>
              <option value="other">{t.notices.categoryOther}</option>
            </Select>
          </Field>
        </div>

        {isLoading ? <TableSkeleton /> : null}
        {isError ? <QueryError onRetry={refetch} /> : null}
        {!isLoading && !rows.length ? <EmptyState title={t.notices.empty} hint={t.notices.emptyHint} /> : null}

        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t.notices.refNo}</th>
                <th className="px-4 py-3">{t.notices.heading}</th>
                <th className="px-4 py-3">{t.notices.issueDate}</th>
                <th className="px-4 py-3">{t.common.audience}</th>
                <th className="px-4 py-3">{t.common.status}</th>
                <th className="px-4 py-3 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{row.refNo || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {row.pinned ? <Pin size={14} className="text-primary" aria-label={t.notices.pinned} /> : null}
                      {row.showOnWebsite ? <Globe size={14} className="text-muted-foreground" aria-label={t.notices.website} /> : null}
                      <span className="font-medium">{row.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{categoryLabel(row.category)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(row.issueDate || row.createdAt || Date.now()).toLocaleDateString(
                      locale === "bn" ? "bn-BD" : "en-GB"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {audienceLabel(row.audience)}
                    {typeof row.classId === "object" && row.classId?.name ? ` · ${row.classId.name}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={row.isPublished === false ? t.common.draft : t.common.published}
                      tone={row.isPublished === false ? "warning" : "success"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setPreview(row)}>
                        {t.notices.view}
                      </Button>
                      <Button type="button" variant="secondary" className="h-8 px-2" onClick={() => openEdit(row)}>
                        {t.common.edit}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 px-2"
                        onClick={async () => {
                          toastApiResult(
                            await updateNotice({ id: row._id, isPublished: row.isPublished === false }),
                            t.common.save,
                            t.common.loadError
                          );
                        }}
                      >
                        {row.isPublished === false ? t.common.publish : t.common.draft}
                      </Button>
                      <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setRemove(row)}>
                        {t.common.delete}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {preview && !open ? (
        <div className="mt-8">
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t.notices.preview}</h2>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                <Printer size={16} className="mr-1.5" />
                {t.notices.printPdf}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPreview(null)}>
                {t.common.close}
              </Button>
            </div>
          </div>
          <NoticeDocument item={previewData!} settings={settings} draft={preview.isPublished === false} />
        </div>
      ) : null}

      <Dialog
        open={open}
        title={edit ? t.common.edit : t.notices.newNotice}
        onClose={() => {
          setOpen(false);
          setEdit(null);
        }}
        className="max-w-5xl"
      >
        <form
          className="grid min-w-0 gap-6 lg:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (form.audience === "class" && !form.classId) {
              return;
            }
            const payload = {
              title: form.title,
              body: form.body,
              audience: form.audience,
              classId: form.audience === "class" ? form.classId : undefined,
              isPublished: form.isPublished,
              refNo: form.refNo || undefined,
              issueDate: form.issueDate || undefined,
              category: form.category,
              signatories: form.signatories.filter((s) => s.name.trim() || s.designation.trim()),
              showOnWebsite: form.audience === "all" ? form.showOnWebsite : false,
              pinned: form.pinned,
            };
            const result = edit
              ? await updateNotice({ id: edit._id, ...payload })
              : await createNotice(payload);
            if (toastApiResult(result, edit ? t.common.save : t.notices.publish, t.common.loadError)) {
              setOpen(false);
              setEdit(null);
            }
          }}
        >
          <div className="min-w-0 space-y-3">
            <Field label={t.notices.heading}>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label={t.notices.body}>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
                rows={10}
                className="min-h-[180px] whitespace-pre-wrap break-words"
                placeholder={t.notices.bodyPlaceholder}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t.common.audience}>
                <Select
                  value={form.audience}
                  onChange={(e) => {
                    const audience = e.target.value;
                    setForm({
                      ...form,
                      audience,
                      showOnWebsite: audience === "all" ? form.showOnWebsite : false,
                    });
                  }}
                >
                  <option value="all">{t.notices.all}</option>
                  <option value="teachers">{t.notices.teachers}</option>
                  <option value="students">{t.notices.students}</option>
                  <option value="guardians">{t.notices.guardians}</option>
                  <option value="class">{t.notices.class}</option>
                </Select>
              </Field>
              <Field label={t.notices.category}>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="general">{t.notices.categoryGeneral}</option>
                  <option value="exam">{t.notices.categoryExam}</option>
                  <option value="holiday">{t.notices.categoryHoliday}</option>
                  <option value="fee">{t.notices.categoryFee}</option>
                  <option value="admission">{t.notices.categoryAdmission}</option>
                  <option value="other">{t.notices.categoryOther}</option>
                </Select>
              </Field>
            </div>
            {form.audience === "class" ? (
              <Field label={t.common.class}>
                <Select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                  <option value="">{t.common.class}</option>
                  {classList.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t.notices.refNo}>
                <Input
                  value={form.refNo}
                  onChange={(e) => setForm({ ...form, refNo: e.target.value })}
                  placeholder="NOT-YYYY-0001"
                />
              </Field>
              <Field label={t.notices.issueDate}>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                />
              </Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">{t.notices.signatories}</p>
              <div className="space-y-2">
                {form.signatories.map((signer, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder={t.notices.signatoryName}
                      value={signer.name}
                      onChange={(e) => updateSignatory(index, { name: e.target.value })}
                    />
                    <Input
                      placeholder={t.notices.signatoryDesignation}
                      value={signer.designation}
                      onChange={(e) => updateSignatory(index, { designation: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              {form.signatories.length < 3 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 h-8"
                  onClick={() =>
                    setForm({
                      ...form,
                      signatories: [...form.signatories, { name: "", designation: "" }],
                    })
                  }
                >
                  {t.notices.addSignatory}
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                {t.common.publish}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.showOnWebsite}
                  disabled={form.audience !== "all"}
                  onChange={(e) => setForm({ ...form, showOnWebsite: e.target.checked })}
                />
                {t.notices.showOnWebsite}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                />
                {t.notices.pinned}
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setOpen(false);
                  setEdit(null);
                }}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit">{edit ? t.common.save : t.notices.publish}</Button>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{t.notices.preview}</p>
              <Button type="button" variant="secondary" className="h-8" onClick={() => window.print()}>
                <Printer size={14} className="mr-1" />
                {t.notices.printPdf}
              </Button>
            </div>
            <div className="max-h-[70vh] min-w-0 overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
              {previewData ? (
                <NoticeDocument item={previewData} settings={settings} draft={!form.isPublished} />
              ) : null}
            </div>
          </div>
        </form>
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
