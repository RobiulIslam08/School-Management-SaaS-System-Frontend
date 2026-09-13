"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { toastApiResult } from "@/lib/toast-api";
import { CertificateDocument, type IssuedCertificate } from "@/components/certificate-document";
import { DataTable, FormPanel } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  useGetCertificateTemplatesQuery,
  useGetCertificatesQuery,
  useGetClassesQuery,
  useGetStudentsQuery,
  useIssueCertificateMutation,
  useMeQuery,
  useUpdateCertificateTemplateMutation,
} from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type Template = {
  _id: string;
  kind: "character" | "transfer" | "testimonial" | "merit";
  name: string;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
};

type StudentRow = { _id: string; name: string; studentId: string };

export default function CertificatesPage() {
  const { t, locale } = useI18n();
  const { data: session } = useMeQuery();
  const permissions = session?.data.user.permissions ?? [];
  const canIssue = permissions.includes("certificates:create");
  const canEditTemplates = permissions.includes("certificates:edit");
  const { data: templatesData, isError: templatesError, isLoading: templatesLoading, refetch: refetchTemplates } =
    useGetCertificateTemplatesQuery();
  const [classId, setClassId] = useState("");
  const { data: issuedData, isLoading, isError, refetch } = useGetCertificatesQuery(classId ? { classId } : undefined);
  const { data: students, isLoading: studentsLoading } = useGetStudentsQuery({ status: "active", classId: classId || undefined });
  const { data: classes } = useGetClassesQuery();
  const [issue, { isLoading: issuing }] = useIssueCertificateMutation();
  const [updateTemplate, { isLoading: savingTemplate }] = useUpdateCertificateTemplateMutation();
  const [tab, setTab] = useState("issue");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [studentQ, setStudentQ] = useState("");
  const [form, setForm] = useState({
    templateId: "",
    studentId: "",
    purpose: "",
    conduct: "good",
    leavingDate: "",
    reason: "",
  });
  const [edit, setEdit] = useState<Template | null>(null);

  const templates = (templatesData?.data ?? []) as Template[];
  const issued = (issuedData?.data ?? []) as IssuedCertificate[];
  const studentList = (students?.data ?? []) as StudentRow[];
  const selectedTemplate = templates.find((item) => item._id === form.templateId);
  const preview = issued.find((item) => item._id === previewId) ?? (tab === "register" ? issued[0] : null);

  const filteredStudents = useMemo(() => {
    const q = studentQ.trim().toLowerCase();
    if (!q) return studentList;
    return studentList.filter(
      (item) => item.name.toLowerCase().includes(q) || item.studentId.toLowerCase().includes(q)
    );
  }, [studentList, studentQ]);

  const kindLabel = useMemo(
    () => ({
      character: t.certificates.character,
      transfer: t.certificates.transfer,
      testimonial: t.certificates.testimonial,
      merit: t.certificates.merit,
    }),
    [t]
  );

  useEffect(() => {
    if (!session?.data.user) return;
    if (!canIssue && tab === "issue") setTab("register");
    if (!canEditTemplates && tab === "templates") setTab("register");
  }, [session, canIssue, canEditTemplates, tab]);

  const tabs = [
    ...(canIssue ? [{ id: "issue", label: t.certificates.issue }] : []),
    { id: "register", label: t.certificates.register },
    ...(canEditTemplates ? [{ id: "templates", label: t.certificates.templates }] : []),
  ];

  return (
    <div>
      <PageHeader
        title={t.certificates.title}
        subtitle={t.certificates.subtitle}
        action={
          preview && tab === "register" ? (
            <Button className="no-print" variant="secondary" onClick={() => window.print()}>
              {t.common.print}
            </Button>
          ) : null
        }
      />
      <WorkspaceTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "issue" && canIssue ? (
        studentsLoading || templatesLoading ? (
          <TableSkeleton rows={3} />
        ) : templatesError ? (
          <QueryError onRetry={refetchTemplates} />
        ) : !studentList.length ? (
          <EmptyState
            title={t.certificates.emptyStudents}
            hint={t.certificates.emptyStudentsHint}
            action={
              <Link href="/students/admit">
                <Button>{t.students.admit}</Button>
              </Link>
            }
          />
        ) : (
          <FormPanel
            className="no-print md:grid-cols-3 lg:grid-cols-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (issuing) return;
              if (!form.templateId || !form.studentId) return toast.error(t.common.required);
              if (selectedTemplate?.kind === "transfer" && !form.leavingDate) return toast.error(t.common.required);
              const result = await issue({ ...form, language: locale });
              if (!toastApiResult(result, t.certificates.issue, t.common.loadError)) return;
              const created = result.data?.data as IssuedCertificate | undefined;
              if (created?._id) setPreviewId(created._id);
              setTab("register");
            }}
          >
            <Field label={t.common.class}>
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">{t.common.all}</option>
                {((classes?.data ?? []) as Array<{ _id: string; name: string }>).map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.certificates.pickTemplate}>
              <Select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}>
                <option value="">{t.certificates.pickTemplate}</option>
                {templates.map((item) => (
                  <option key={item._id} value={item._id}>
                    {kindLabel[item.kind]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.common.search}>
              <Input
                value={studentQ}
                onChange={(e) => setStudentQ(e.target.value)}
                placeholder={t.common.searchPlaceholder}
              />
            </Field>
            <Field label={t.certificates.pickStudent}>
              <Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                <option value="">{t.certificates.pickStudent}</option>
                {filteredStudents.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} · {item.studentId}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.certificates.purpose}>
              <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </Field>
            <Field label={t.certificates.conduct}>
              <Select value={form.conduct} onChange={(e) => setForm({ ...form, conduct: e.target.value })}>
                <option value="good">{t.certificates.good}</option>
                <option value="excellent">{t.certificates.excellent}</option>
              </Select>
            </Field>
            {selectedTemplate?.kind === "transfer" ? (
              <>
                <Field label={t.certificates.leaving}>
                  <Input type="date" value={form.leavingDate} onChange={(e) => setForm({ ...form, leavingDate: e.target.value })} />
                </Field>
                <Field label={t.certificates.reason}>
                  <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </Field>
              </>
            ) : null}
            <Button type="submit" disabled={issuing}>
              {t.common.issue}
            </Button>
          </FormPanel>
        )
      ) : null}

      {tab === "register" ? (
        <div className="no-print">
          {isLoading ? <TableSkeleton /> : null}
          {isError ? <QueryError onRetry={refetch} /> : null}
          {!isLoading && !issued.length ? <EmptyState title={t.certificates.empty} hint={t.certificates.emptyHint} /> : null}
          <DataTable
            rows={issued}
            rowKey={(row) => row._id}
            columns={[
              { header: t.certificates.number, cell: (row) => row.certNo },
              { header: t.common.student, cell: (row) => row.studentId?.name ?? "—" },
              { header: t.certificates.type, cell: (row) => kindLabel[row.kind as keyof typeof kindLabel] ?? row.kind },
              { header: t.common.date, cell: (row) => new Date(row.issueDate).toLocaleDateString() },
              {
                header: t.common.actions,
                cell: (row) => (
                  <Button type="button" variant={preview?._id === row._id ? "primary" : "secondary"} onClick={() => setPreviewId(row._id)}>
                    {t.common.print}
                  </Button>
                ),
              },
            ]}
          />
        </div>
      ) : null}

      {tab === "templates" && canEditTemplates ? (
        <div className="no-print grid gap-6 lg:grid-cols-[16rem_1fr]">
          <div className="space-y-2">
            {templatesLoading ? <TableSkeleton rows={4} /> : null}
            {templatesError ? <QueryError onRetry={refetchTemplates} /> : null}
            {templates.map((item) => (
              <button
                key={item._id}
                type="button"
                className={`h-11 w-full rounded-xl border px-4 text-left text-sm ${edit?._id === item._id ? "border-primary bg-primary/5" : "bg-white"}`}
                onClick={() => setEdit(item)}
              >
                {kindLabel[item.kind]}
              </button>
            ))}
          </div>
          {edit ? (
            <form
              className="space-y-3 rounded-xl border bg-white p-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (savingTemplate) return;
                const result = await updateTemplate({
                  id: edit._id,
                  titleBn: edit.titleBn,
                  titleEn: edit.titleEn,
                  bodyBn: edit.bodyBn,
                  bodyEn: edit.bodyEn,
                });
                toastApiResult(result, t.common.save, t.common.loadError);
              }}
            >
              <p className="text-xs text-muted-foreground">{t.certificates.placeholders}</p>
              <Field label={t.certificates.titleBn}>
                <Input value={edit.titleBn} onChange={(e) => setEdit({ ...edit, titleBn: e.target.value })} />
              </Field>
              <Field label={t.certificates.titleEn}>
                <Input value={edit.titleEn} onChange={(e) => setEdit({ ...edit, titleEn: e.target.value })} />
              </Field>
              <Field label={t.certificates.bodyBn}>
                <Textarea value={edit.bodyBn} onChange={(e) => setEdit({ ...edit, bodyBn: e.target.value })} />
              </Field>
              <Field label={t.certificates.bodyEn}>
                <Textarea value={edit.bodyEn} onChange={(e) => setEdit({ ...edit, bodyEn: e.target.value })} />
              </Field>
              <Button type="submit" disabled={savingTemplate}>
                {t.common.save}
              </Button>
            </form>
          ) : (
            <EmptyState title={t.certificates.templates} hint={t.certificates.placeholders} />
          )}
        </div>
      ) : null}

      {preview && tab === "register" ? (
        <div className="mt-8">
          <CertificateDocument item={preview} settings={session?.data.settings} />
        </div>
      ) : null}
    </div>
  );
}
