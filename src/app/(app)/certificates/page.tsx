"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { toastApiResult } from "@/lib/toast-api";
import { CertificateDocument, type IssuedCertificate } from "@/components/certificate-document";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, FieldError, Input, Select, Textarea } from "@/components/ui";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  CERTIFICATE_PLACEHOLDERS,
  SAMPLE_CERTIFICATE_VALUES,
  fillPlaceholders,
} from "@/lib/certificate-placeholders";
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
import { cn } from "@/lib/utils";

type Template = {
  _id: string;
  kind: "character" | "transfer" | "testimonial" | "merit";
  name: string;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
};

type StudentRow = {
  _id: string;
  name: string;
  nameBn?: string;
  studentId: string;
  rollNo?: string;
  section?: string;
  group?: string;
  academicYear?: string;
  classId?: { _id?: string; name?: string } | string;
  guardian?: { fatherName?: string; motherName?: string };
};

const issueSchema = z.object({
  templateId: z.string().min(1),
  studentId: z.string().min(1),
  purpose: z.string().max(200).optional(),
  conduct: z.enum(["good", "excellent"]),
  leavingDate: z.string().optional(),
  reason: z.string().max(200).optional(),
});

type IssueForm = z.infer<typeof issueSchema>;

const EMPTY_ISSUE: IssueForm = {
  templateId: "",
  studentId: "",
  purpose: "",
  conduct: "good",
  leavingDate: "",
  reason: "",
};

export default function CertificatesPage() {
  const { t, locale } = useI18n();
  const { data: session } = useMeQuery();
  const permissions = session?.data.user.permissions ?? [];
  const canIssue = permissions.includes("certificates:create");
  const canEditTemplates = permissions.includes("certificates:edit");
  const settings = session?.data.settings;

  const { data: templatesData, isError: templatesError, isLoading: templatesLoading, refetch: refetchTemplates } =
    useGetCertificateTemplatesQuery();
  const [issueClassId, setIssueClassId] = useState("");
  const [registerClassId, setRegisterClassId] = useState("");
  const [registerKind, setRegisterKind] = useState("");
  const [registerQ, setRegisterQ] = useState("");

  const registerQuery = useMemo(() => {
    const arg: { kind?: string; classId?: string } = {};
    if (registerKind) arg.kind = registerKind;
    if (registerClassId) arg.classId = registerClassId;
    return Object.keys(arg).length ? arg : undefined;
  }, [registerClassId, registerKind]);

  const { data: issuedData, isLoading, isError, refetch } = useGetCertificatesQuery(registerQuery);
  const { data: students, isLoading: studentsLoading } = useGetStudentsQuery({
    status: "active",
    classId: issueClassId || undefined,
  });
  const { data: classes } = useGetClassesQuery();
  const [issue, { isLoading: issuing }] = useIssueCertificateMutation();
  const [updateTemplate, { isLoading: savingTemplate }] = useUpdateCertificateTemplateMutation();

  const [tab, setTab] = useState("issue");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [studentQ, setStudentQ] = useState("");
  const [edit, setEdit] = useState<Template | null>(null);
  const [activeBodyField, setActiveBodyField] = useState<"bodyBn" | "bodyEn">("bodyBn");
  const bodyBnRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyEnRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<IssueForm>({
    resolver: zodResolver(issueSchema),
    defaultValues: EMPTY_ISSUE,
  });
  const watched = form.watch();

  const templates = (templatesData?.data ?? []) as Template[];
  const issued = (issuedData?.data ?? []) as IssuedCertificate[];
  const studentList = (students?.data ?? []) as StudentRow[];
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string }>;
  const selectedTemplate = templates.find((item) => item._id === watched.templateId);
  const selectedStudent = studentList.find((item) => item._id === watched.studentId);
  const preview = issued.find((item) => item._id === previewId) ?? null;

  const filteredStudents = useMemo(() => {
    const q = studentQ.trim().toLowerCase();
    let list = studentList;
    if (q) {
      list = studentList.filter(
        (item) => item.name.toLowerCase().includes(q) || item.studentId.toLowerCase().includes(q)
      );
    }
    if (selectedStudent && !list.some((item) => item._id === selectedStudent._id)) {
      list = [selectedStudent, ...list];
    }
    return list;
  }, [studentList, studentQ, selectedStudent]);

  const filteredIssued = useMemo(() => {
    const q = registerQ.trim().toLowerCase();
    if (!q) return issued;
    return issued.filter((row) => {
      const name = row.studentId?.name?.toLowerCase() ?? "";
      const sid = row.studentId?.studentId?.toLowerCase() ?? "";
      return row.certNo.toLowerCase().includes(q) || name.includes(q) || sid.includes(q);
    });
  }, [issued, registerQ]);

  const kindLabel = useMemo(
    () => ({
      character: t.certificates.character,
      transfer: t.certificates.transfer,
      testimonial: t.certificates.testimonial,
      merit: t.certificates.merit,
    }),
    [t]
  );

  const draftValues = useMemo(() => {
    const className =
      selectedStudent?.classId && typeof selectedStudent.classId === "object"
        ? selectedStudent.classId.name ?? ""
        : "";
    const conductLabel =
      watched.conduct === "excellent"
        ? locale === "bn"
          ? "অতি উত্তম"
          : "excellent"
        : locale === "bn"
          ? "উত্তম"
          : "good";
    const year = settings?.academicYear ?? String(new Date().getFullYear());
    return {
      school_name: settings?.name ?? "",
      eiin: settings?.eiin ?? "",
      address: settings?.address ?? "",
      student_name:
        locale === "bn" && selectedStudent?.nameBn ? selectedStudent.nameBn : selectedStudent?.name ?? "—",
      student_id: selectedStudent?.studentId ?? "—",
      roll: selectedStudent?.rollNo ?? "",
      class: className,
      section: selectedStudent?.section ?? "",
      group: selectedStudent?.group && selectedStudent.group !== "None" ? selectedStudent.group : "",
      session: selectedStudent?.academicYear || year,
      father_name: selectedStudent?.guardian?.fatherName ?? "",
      mother_name: selectedStudent?.guardian?.motherName ?? "",
      issue_date: new Date().toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB"),
      purpose: watched.purpose?.trim() || (locale === "bn" ? "প্রয়োজনীয় কাজে" : "official purposes"),
      conduct: conductLabel,
      leaving_date: watched.leavingDate
        ? new Date(watched.leavingDate).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB")
        : "",
      reason: watched.reason?.trim() ?? "",
      cert_no: "DRAFT",
    };
  }, [selectedStudent, watched, settings, locale]);

  const draftDoc = useMemo(() => {
    if (!selectedTemplate) return null;
    const titleSource = locale === "bn" ? selectedTemplate.titleBn : selectedTemplate.titleEn;
    const bodySource = locale === "bn" ? selectedTemplate.bodyBn : selectedTemplate.bodyEn;
    return {
      certNo: "DRAFT",
      renderedTitle: fillPlaceholders(titleSource, draftValues),
      renderedBody: fillPlaceholders(bodySource, draftValues),
      issueDate: new Date().toISOString(),
      issuedByName: session?.data.user.name,
      language: locale as "bn" | "en",
    };
  }, [selectedTemplate, draftValues, locale, session?.data.user.name]);

  const templatePreviewDoc = useMemo(() => {
    if (!edit) return null;
    const titleSource = locale === "bn" ? edit.titleBn : edit.titleEn;
    const bodySource = locale === "bn" ? edit.bodyBn : edit.bodyEn;
    const sample: Record<string, string> = {
      ...SAMPLE_CERTIFICATE_VALUES,
      school_name: settings?.name || SAMPLE_CERTIFICATE_VALUES.school_name,
      eiin: settings?.eiin || SAMPLE_CERTIFICATE_VALUES.eiin,
      address: settings?.address || SAMPLE_CERTIFICATE_VALUES.address,
      session: settings?.academicYear || SAMPLE_CERTIFICATE_VALUES.session,
    };
    return {
      certNo: sample.cert_no,
      renderedTitle: fillPlaceholders(titleSource, sample),
      renderedBody: fillPlaceholders(bodySource, sample),
      issueDate: new Date().toISOString(),
      language: locale as "bn" | "en",
    };
  }, [edit, locale, settings]);

  useEffect(() => {
    if (!session?.data.user) return;
    if (!canIssue && tab === "issue") setTab("register");
    if (!canEditTemplates && tab === "templates") setTab("register");
  }, [session, canIssue, canEditTemplates, tab]);

  useEffect(() => {
    if (templates.length && !edit) setEdit(templates[0]);
  }, [templates, edit]);

  const tabs = [
    ...(canIssue ? [{ id: "issue", label: t.certificates.issue }] : []),
    { id: "register", label: t.certificates.register },
    ...(canEditTemplates ? [{ id: "templates", label: t.certificates.templates }] : []),
  ];

  async function onIssue(values: IssueForm) {
    if (issuing) return;
    const template = templates.find((item) => item._id === values.templateId);
    if (template?.kind === "transfer" && !values.leavingDate) {
      form.setError("leavingDate", { message: t.common.required });
      return toast.error(t.common.required);
    }
    const result = await issue({ ...values, language: locale });
    if (!toastApiResult(result, t.certificates.issue, t.common.loadError)) return;
    const created = result.data?.data as IssuedCertificate | undefined;
    if (created?._id) setPreviewId(created._id);
    form.reset(EMPTY_ISSUE);
    setStudentQ("");
    setTab("register");
  }

  function insertPlaceholder(token: string) {
    if (!edit) return;
    const field = activeBodyField;
    const ref = field === "bodyBn" ? bodyBnRef.current : bodyEnRef.current;
    const current = edit[field] ?? "";
    const insert = `{{${token}}}`;
    if (ref) {
      const start = ref.selectionStart ?? current.length;
      const end = ref.selectionEnd ?? current.length;
      const next = current.slice(0, start) + insert + current.slice(end);
      setEdit({ ...edit, [field]: next });
      requestAnimationFrame(() => {
        ref.focus();
        const pos = start + insert.length;
        ref.setSelectionRange(pos, pos);
      });
    } else {
      setEdit({ ...edit, [field]: current + insert });
    }
  }

  return (
    <div className="certificates-page">
      <div className="no-print">
        <PageHeader title={t.certificates.title} subtitle={t.certificates.subtitle} />
        <WorkspaceTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === "issue" && canIssue ? (
        studentsLoading || templatesLoading ? (
          <div className="no-print">
            <TableSkeleton rows={4} />
          </div>
        ) : templatesError ? (
          <div className="no-print">
            <QueryError onRetry={refetchTemplates} />
          </div>
        ) : !studentList.length && !issueClassId ? (
          <div className="no-print">
            <EmptyState
              title={t.certificates.emptyStudents}
              hint={t.certificates.emptyStudentsHint}
              action={
                <Link href="/students/admit">
                  <Button>{t.students.admit}</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <form
              className="no-print space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm"
              onSubmit={form.handleSubmit(onIssue)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.certificates.pickTemplate} htmlFor="cert-template">
                  <Select id="cert-template" {...form.register("templateId")}>
                    <option value="">{t.certificates.pickTemplate}</option>
                    {templates.map((item) => (
                      <option key={item._id} value={item._id}>
                        {kindLabel[item.kind]}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={form.formState.errors.templateId ? t.common.required : undefined} />
                </Field>
                <Field label={t.common.class} htmlFor="issue-class">
                  <Select id="issue-class" value={issueClassId} onChange={(e) => setIssueClassId(e.target.value)}>
                    <option value="">{t.common.all}</option>
                    {classList.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t.common.search} htmlFor="student-q">
                  <Input
                    id="student-q"
                    value={studentQ}
                    onChange={(e) => setStudentQ(e.target.value)}
                    placeholder={t.common.searchPlaceholder}
                  />
                </Field>
                <Field label={t.certificates.pickStudent} htmlFor="cert-student">
                  <Select id="cert-student" {...form.register("studentId")}>
                    <option value="">{t.certificates.pickStudent}</option>
                    {filteredStudents.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} · {item.studentId}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={form.formState.errors.studentId ? t.common.required : undefined} />
                </Field>
                <Field label={t.certificates.purpose} htmlFor="cert-purpose">
                  <Input id="cert-purpose" {...form.register("purpose")} />
                </Field>
                <Field label={t.certificates.conduct} htmlFor="cert-conduct">
                  <Select id="cert-conduct" {...form.register("conduct")}>
                    <option value="good">{t.certificates.good}</option>
                    <option value="excellent">{t.certificates.excellent}</option>
                  </Select>
                </Field>
                {selectedTemplate?.kind === "transfer" ? (
                  <>
                    <Field label={t.certificates.leaving} htmlFor="cert-leaving">
                      <Input id="cert-leaving" type="date" {...form.register("leavingDate")} />
                      <FieldError message={form.formState.errors.leavingDate?.message} />
                    </Field>
                    <Field label={t.certificates.reason} htmlFor="cert-reason">
                      <Input id="cert-reason" {...form.register("reason")} />
                    </Field>
                  </>
                ) : null}
              </div>

              {selectedStudent ? (
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.certificates.studentSummary}
                  </p>
                  <p className="mt-1 font-medium">{selectedStudent.name}</p>
                  <p className="text-muted-foreground">
                    {selectedStudent.studentId}
                    {selectedStudent.rollNo ? ` · ${t.common.roll} ${selectedStudent.rollNo}` : ""}
                    {typeof selectedStudent.classId === "object" && selectedStudent.classId?.name
                      ? ` · ${selectedStudent.classId.name}`
                      : ""}
                    {selectedStudent.section ? ` · ${selectedStudent.section}` : ""}
                  </p>
                </div>
              ) : null}

              {!studentList.length && issueClassId ? (
                <EmptyState title={t.certificates.emptyStudents} hint={t.certificates.emptyStudentsHint} />
              ) : null}

              <Button type="submit" className="w-full sm:w-auto" disabled={issuing} aria-busy={issuing}>
                {t.common.issue}
              </Button>
            </form>

            <div className="min-w-0">
              <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">{t.certificates.draftPreview}</p>
                {draftDoc ? (
                  <Button type="button" variant="secondary" onClick={() => window.print()}>
                    {t.common.print}
                  </Button>
                ) : null}
              </div>
              {draftDoc ? (
                <CertificateDocument item={draftDoc} settings={settings} draft />
              ) : (
                <div className="no-print rounded-xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
                  {t.certificates.pickTemplate} · {t.certificates.pickStudent}
                </div>
              )}
            </div>
          </div>
        )
      ) : null}

      {tab === "register" ? (
        <div className="space-y-6">
          <div className="no-print grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t.common.class} htmlFor="reg-class">
              <Select id="reg-class" value={registerClassId} onChange={(e) => setRegisterClassId(e.target.value)}>
                <option value="">{t.common.all}</option>
                {classList.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.certificates.type} htmlFor="reg-kind">
              <Select id="reg-kind" value={registerKind} onChange={(e) => setRegisterKind(e.target.value)}>
                <option value="">{t.common.all}</option>
                {(Object.keys(kindLabel) as Array<keyof typeof kindLabel>).map((key) => (
                  <option key={key} value={key}>
                    {kindLabel[key]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.common.search} htmlFor="reg-q">
              <Input
                id="reg-q"
                value={registerQ}
                onChange={(e) => setRegisterQ(e.target.value)}
                placeholder={t.certificates.searchCert}
              />
            </Field>
          </div>

          <div className="no-print">
            {isLoading ? <TableSkeleton /> : null}
            {isError ? <QueryError onRetry={refetch} /> : null}
            {!isLoading && !issued.length ? (
              <EmptyState
                title={t.certificates.empty}
                hint={t.certificates.emptyHint}
                action={
                  canIssue ? (
                    <Button type="button" onClick={() => setTab("issue")}>
                      {t.certificates.emptyRegisterAction}
                    </Button>
                  ) : undefined
                }
              />
            ) : null}
            {!isLoading && issued.length && !filteredIssued.length ? (
              <EmptyState title={t.certificates.empty} hint={t.certificates.searchCert} />
            ) : null}
            <DataTable
              rows={filteredIssued}
              rowKey={(row) => row._id}
              pageSize={10}
              columns={[
                {
                  header: t.certificates.number,
                  sortValue: (row) => row.certNo,
                  cell: (row) => (
                    <span className={cn(previewId === row._id && "font-semibold text-primary")}>{row.certNo}</span>
                  ),
                },
                {
                  header: t.common.student,
                  sortValue: (row) => row.studentId?.name ?? "",
                  cell: (row) => (
                    <span>
                      {row.studentId?.name ?? "—"}
                      {row.studentId?.studentId ? (
                        <span className="block text-xs text-muted-foreground">{row.studentId.studentId}</span>
                      ) : null}
                    </span>
                  ),
                },
                {
                  header: t.common.class,
                  sortValue: (row) => row.studentId?.classId?.name ?? "",
                  cell: (row) => row.studentId?.classId?.name ?? "—",
                },
                {
                  header: t.certificates.type,
                  sortValue: (row) => row.kind,
                  cell: (row) => kindLabel[row.kind as keyof typeof kindLabel] ?? row.kind,
                },
                {
                  header: t.common.date,
                  sortValue: (row) => new Date(row.issueDate).getTime(),
                  cell: (row) => new Date(row.issueDate).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB"),
                },
                {
                  header: t.certificates.issuedBy,
                  sortValue: (row) => row.issuedByName ?? "",
                  cell: (row) => row.issuedByName || "—",
                },
                {
                  header: t.common.actions,
                  cell: (row) => (
                    <Button
                      type="button"
                      variant={previewId === row._id ? "primary" : "secondary"}
                      onClick={() => setPreviewId(row._id)}
                    >
                      {t.common.view}
                    </Button>
                  ),
                },
              ]}
              mobileCard={(row) => (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.certNo}</p>
                      <p className="text-sm text-muted-foreground">{row.studentId?.name ?? "—"}</p>
                    </div>
                    <Button
                      type="button"
                      variant={previewId === row._id ? "primary" : "secondary"}
                      onClick={() => setPreviewId(row._id)}
                    >
                      {t.common.view}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {kindLabel[row.kind as keyof typeof kindLabel] ?? row.kind}
                    {" · "}
                    {new Date(row.issueDate).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB")}
                  </p>
                </div>
              )}
            />
          </div>

          {preview ? (
            <div className="certificate-print-target">
              <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{t.certificates.printPreview}</p>
                <Button variant="secondary" onClick={() => window.print()}>
                  {t.common.print}
                </Button>
              </div>
              <CertificateDocument item={preview} settings={settings} />
            </div>
          ) : !isLoading && issued.length ? (
            <p className="no-print text-center text-sm text-muted-foreground">{t.certificates.selectToPreview}</p>
          ) : null}
        </div>
      ) : null}

      {tab === "templates" && canEditTemplates ? (
        <div className="no-print space-y-6">
          <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <div className="space-y-2">
              {templatesLoading ? <TableSkeleton rows={4} /> : null}
              {templatesError ? <QueryError onRetry={refetchTemplates} /> : null}
              {templates.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className={cn(
                    "h-11 w-full rounded-xl border px-4 text-left text-sm transition",
                    edit?._id === item._id ? "border-primary bg-primary/5 font-medium" : "border-border bg-white hover:bg-muted"
                  )}
                  onClick={() => setEdit(item)}
                >
                  {kindLabel[item.kind]}
                </button>
              ))}
            </div>
            {edit ? (
              <form
                className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-sm"
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
                <div className="flex flex-wrap gap-1.5">
                  {CERTIFICATE_PLACEHOLDERS.map((token) => (
                    <button
                      key={token}
                      type="button"
                      className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] text-foreground hover:bg-muted"
                      onClick={() => insertPlaceholder(token)}
                    >
                      {`{{${token}}}`}
                    </button>
                  ))}
                </div>
                <Field label={t.certificates.titleBn} htmlFor="tpl-title-bn">
                  <Input
                    id="tpl-title-bn"
                    value={edit.titleBn}
                    onChange={(e) => setEdit({ ...edit, titleBn: e.target.value })}
                  />
                </Field>
                <Field label={t.certificates.titleEn} htmlFor="tpl-title-en">
                  <Input
                    id="tpl-title-en"
                    value={edit.titleEn}
                    onChange={(e) => setEdit({ ...edit, titleEn: e.target.value })}
                  />
                </Field>
                <Field label={t.certificates.bodyBn} htmlFor="tpl-body-bn">
                  <Textarea
                    id="tpl-body-bn"
                    ref={bodyBnRef}
                    value={edit.bodyBn}
                    onFocus={() => setActiveBodyField("bodyBn")}
                    onChange={(e) => setEdit({ ...edit, bodyBn: e.target.value })}
                  />
                </Field>
                <Field label={t.certificates.bodyEn} htmlFor="tpl-body-en">
                  <Textarea
                    id="tpl-body-en"
                    ref={bodyEnRef}
                    value={edit.bodyEn}
                    onFocus={() => setActiveBodyField("bodyEn")}
                    onChange={(e) => setEdit({ ...edit, bodyEn: e.target.value })}
                  />
                </Field>
                <Button type="submit" disabled={savingTemplate} aria-busy={savingTemplate}>
                  {t.common.save}
                </Button>
              </form>
            ) : (
              <EmptyState title={t.certificates.templates} hint={t.certificates.placeholders} />
            )}
          </div>
          {templatePreviewDoc ? (
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">{t.certificates.draftPreview}</p>
              <CertificateDocument item={templatePreviewDoc} settings={settings} draft />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
