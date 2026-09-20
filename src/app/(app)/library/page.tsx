"use client";

import { useMemo, useState } from "react";
import { BookOpen, Repeat } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { Button, Field, Input, Select } from "@/components/ui";
import { useDeleteBookMutation, useReturnBookMutation, useUpdateBookMutation } from "@/lib/api/operationsApi";
import { useCreateBookMutation, useGetBooksQuery, useGetIssuesQuery, useGetStudentsQuery, useIssueBookMutation } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type BookRow = {
  _id: string;
  title: string;
  author?: string;
  copies: number;
  available: number;
  collectedAt?: string;
  createdAt?: string;
};
type IssueRow = {
  _id: string;
  dueAt?: string;
  status?: string;
  bookId?: { title?: string };
  studentId?: { name?: string; studentId?: string };
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyBook = { title: "", author: "", copies: 1, collectedAt: today() };

export default function LibraryPage() {
  const { t, locale } = useI18n();
  const { data, isLoading, isError, refetch } = useGetBooksQuery();
  const { data: issuesData, isLoading: issuesLoading } = useGetIssuesQuery();
  const { data: students } = useGetStudentsQuery({ status: "active" });
  const [createBook] = useCreateBookMutation();
  const [updateBook] = useUpdateBookMutation();
  const [deleteBook] = useDeleteBookMutation();
  const [issueBook] = useIssueBookMutation();
  const [returnBook] = useReturnBookMutation();
  const [tab, setTab] = useState("catalogue");
  const [bookOpen, setBookOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [edit, setEdit] = useState<BookRow | null>(null);
  const [remove, setRemove] = useState<BookRow | null>(null);
  const [returning, setReturning] = useState<IssueRow | null>(null);
  const [form, setForm] = useState(emptyBook);
  const [issueForm, setIssueForm] = useState({ bookId: "", studentId: "", dueAt: "" });
  const rows = (data?.data ?? []) as BookRow[];
  const issues = (issuesData?.data ?? []) as IssueRow[];
  const studentList = (students?.data ?? []) as Array<{ _id: string; name: string; studentId: string }>;
  const available = useMemo(() => rows.reduce((sum, row) => sum + (row.available ?? 0), 0), [rows]);
  const openIssues = issues.filter((row) => row.status !== "returned").length;

  function formatDate(value?: string) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB");
  }

  return (
    <div>
      <PageHeader
        title={t.library.title}
        subtitle={t.library.subtitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => setIssueOpen(true)}>
              {t.library.issue}
            </Button>
            <Button
              onClick={() => {
                setForm({ ...emptyBook, collectedAt: today() });
                setEdit(null);
                setBookOpen(true);
              }}
            >
              {t.common.add}
            </Button>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.library.catalogue} value={rows.length} icon={<BookOpen size={18} />} />
        <StatCard label={t.library.available} value={available} tone="success" />
        <StatCard label={t.library.issued} value={openIssues} icon={<Repeat size={18} />} tone="warning" />
      </div>
      <WorkspaceTabs
        tabs={[
          { id: "catalogue", label: t.library.catalogue },
          { id: "issues", label: t.library.issues },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "catalogue" ? (
        <>
          {isLoading ? <TableSkeleton /> : null}
          {isError ? <QueryError onRetry={refetch} /> : null}
          {!isLoading && !rows.length ? <EmptyState title={t.library.empty} hint={t.library.emptyHint} /> : null}
          <DataTable
            searchable
            pageSize={12}
            rows={rows}
            rowKey={(row) => row._id}
            columns={[
              { header: t.library.book, cell: (row) => row.title, sortValue: (row) => row.title },
              { header: t.library.author, cell: (row) => row.author || "—" },
              {
                header: t.library.collectedAt,
                cell: (row) => formatDate(row.collectedAt || row.createdAt),
                sortValue: (row) => row.collectedAt || row.createdAt || "",
              },
              {
                header: t.library.stock,
                cell: (row) => `${row.available} / ${row.copies}`,
                align: "right",
                sortValue: (row) => row.available,
              },
            ]}
            actions={(row) => [
              {
                label: t.common.edit,
                onClick: () => {
                  setEdit(row);
                  setForm({
                    title: row.title,
                    author: row.author ?? "",
                    copies: row.copies,
                    collectedAt: row.collectedAt
                      ? new Date(row.collectedAt).toISOString().slice(0, 10)
                      : row.createdAt
                        ? new Date(row.createdAt).toISOString().slice(0, 10)
                        : today(),
                  });
                  setBookOpen(true);
                },
              },
              { label: t.common.delete, onClick: () => setRemove(row) },
            ]}
          />
        </>
      ) : (
        <>
          {issuesLoading ? <TableSkeleton /> : null}
          {!issuesLoading && !issues.length ? <EmptyState title={t.library.emptyIssues} /> : null}
          <DataTable
            searchable
            pageSize={12}
            rows={issues}
            rowKey={(row) => row._id}
            columns={[
              { header: t.library.book, cell: (row) => row.bookId?.title ?? "—" },
              {
                header: t.common.student,
                cell: (row) => `${row.studentId?.name ?? "—"} ${row.studentId?.studentId ?? ""}`.trim(),
              },
              { header: t.library.due, cell: (row) => (row.dueAt ? formatDate(row.dueAt) : "—") },
              {
                header: t.common.status,
                cell: (row) => (
                  <StatusBadge
                    label={row.status === "returned" ? t.common.return : t.library.issued}
                    tone={row.status === "returned" ? "success" : "warning"}
                  />
                ),
              },
            ]}
            actions={(row) =>
              row.status === "returned" ? [] : [{ label: t.common.return, onClick: () => setReturning(row) }]
            }
          />
        </>
      )}
      <Dialog
        open={bookOpen}
        title={edit ? t.common.edit : t.common.add}
        onClose={() => {
          setBookOpen(false);
          setEdit(null);
        }}
      >
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = {
              title: form.title,
              author: form.author,
              copies: Number(form.copies),
              collectedAt: form.collectedAt || undefined,
            };
            const result = edit ? await updateBook({ id: edit._id, ...payload }) : await createBook(payload);
            if (toastApiResult(result, t.common.save, t.common.loadError)) {
              setBookOpen(false);
              setEdit(null);
            }
          }}
        >
          <Field label={t.library.book}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label={t.library.author}>
            <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </Field>
          <Field label={t.library.collectedAt}>
            <Input
              type="date"
              value={form.collectedAt}
              onChange={(e) => setForm({ ...form, collectedAt: e.target.value })}
              required
            />
          </Field>
          <Field label={t.library.copies}>
            <Input
              type="number"
              min={1}
              value={form.copies}
              onChange={(e) => setForm({ ...form, copies: Number(e.target.value) })}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setBookOpen(false);
                setEdit(null);
              }}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit">{t.common.save}</Button>
          </div>
        </form>
      </Dialog>
      <Dialog open={issueOpen} title={t.library.issue} onClose={() => setIssueOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await issueBook(issueForm);
            if (toastApiResult(result, t.library.issue, t.common.loadError)) {
              setIssueOpen(false);
              setIssueForm({ bookId: "", studentId: "", dueAt: "" });
            }
          }}
        >
          <Field label={t.library.book}>
            <Select value={issueForm.bookId} onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}>
              <option value="">{t.library.book}</option>
              {rows
                .filter((row) => row.available > 0)
                .map((row) => (
                  <option key={row._id} value={row._id}>
                    {row.title}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label={t.common.student}>
            <Select
              value={issueForm.studentId}
              onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
            >
              <option value="">{t.common.student}</option>
              {studentList.map((row) => (
                <option key={row._id} value={row._id}>
                  {row.name} · {row.studentId}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.library.due}>
            <Input
              type="date"
              value={issueForm.dueAt}
              onChange={(e) => setIssueForm({ ...issueForm, dueAt: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIssueOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button disabled={!issueForm.bookId || !issueForm.studentId || !issueForm.dueAt} type="submit">
              {t.library.issue}
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={Boolean(remove)}
        title={t.library.deleteAsk}
        message={remove?.title ?? ""}
        danger
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          if (!remove) return;
          const result = await deleteBook(remove._id);
          if (toastApiResult(result, t.common.delete, t.common.loadError)) setRemove(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(returning)}
        title={t.library.returnAsk}
        message={returning?.bookId?.title ?? ""}
        confirmLabel={t.common.return}
        onClose={() => setReturning(null)}
        onConfirm={async () => {
          if (!returning) return;
          const result = await returnBook(returning._id);
          if (toastApiResult(result, t.common.return, t.common.loadError)) setReturning(null);
        }}
      />
    </div>
  );
}
