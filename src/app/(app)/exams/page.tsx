"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable, FormPanel } from "@/components/data-table";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select } from "@/components/ui";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  useCreateExamMutation,
  useCreateRuleMutation,
  useDeleteExamMutation,
  useGetClassesQuery,
  useGetExamsQuery,
  useGetFinalGradeQuery,
  useGetRulesQuery,
  useGetStudentsQuery,
  useMeQuery,
  useUpdateExamMutation,
} from "@/lib/api/schoolApi";
import { usePublishExamMutation } from "@/lib/api/workspaceApi";
import { duplicateExamLabels } from "@/lib/exam-names";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ExamRow = {
  _id: string;
  name: string;
  code: string;
  academicYear: string;
  isPublished?: boolean;
  startDate?: string;
  endDate?: string;
};
type RuleRow = {
  name: string;
  academicYear: string;
  isDefault?: boolean;
  classId?: string | { _id?: string } | null;
  weights: Array<{ weight: number; examTypeId?: { _id?: string; name?: string } | string }>;
};

function examWeightId(value: RuleRow["weights"][number]["examTypeId"]): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id ?? "";
}

function ruleClassId(rule: RuleRow): string {
  if (!rule.classId) return "";
  if (typeof rule.classId === "string") return rule.classId;
  return rule.classId._id ?? "";
}

function matchingRule(rules: RuleRow[], academicYear: string, classId: string): RuleRow | undefined {
  if (classId) {
    const byClass = rules.find((rule) => rule.academicYear === academicYear && ruleClassId(rule) === classId);
    if (byClass) return byClass;
  }
  return (
    rules.find((rule) => rule.academicYear === academicYear && rule.isDefault && !ruleClassId(rule)) ??
    rules.find((rule) => rule.academicYear === academicYear && rule.isDefault) ??
    rules.find((rule) => rule.isDefault)
  );
}

function toDateInput(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function ExamsPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const canPublish = (session?.data.user.permissions ?? []).includes("results:approve");
  const settingsYear = session?.data.settings?.academicYear ?? "2026";
  const [tab, setTab] = useState("list");
  const [yearFilter, setYearFilter] = useState(settingsYear);
  const { data, isLoading, isError, refetch } = useGetExamsQuery();
  const { data: rules } = useGetRulesQuery();
  const [createExam] = useCreateExamMutation();
  const [updateExam] = useUpdateExamMutation();
  const [deleteExam] = useDeleteExamMutation();
  const [createRule] = useCreateRuleMutation();
  const [publishExam] = usePublishExamMutation();
  const { data: classes } = useGetClassesQuery();
  const [formulaClassId, setFormulaClassId] = useState("");
  const [exam, setExam] = useState({
    name: "",
    code: "",
    academicYear: settingsYear,
    startDate: "",
    endDate: "",
  });
  const [edit, setEdit] = useState<ExamRow | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [previewStudentId, setPreviewStudentId] = useState("");
  const { data: students } = useGetStudentsQuery({ status: "active" });
  const { data: finalData, isFetching: finalLoading } = useGetFinalGradeQuery(
    previewStudentId && yearFilter
      ? { studentId: previewStudentId, academicYear: yearFilter }
      : { studentId: "", academicYear: "" },
    { skip: !previewStudentId || !yearFilter }
  );

  const allExams = useMemo(() => (data?.data ?? []) as ExamRow[], [data?.data]);
  const years = useMemo(() => {
    const set = new Set(allExams.map((item) => item.academicYear).filter(Boolean));
    set.add(settingsYear);
    return Array.from(set).sort();
  }, [allExams, settingsYear]);

  const exams = useMemo(
    () => allExams.filter((item) => !yearFilter || item.academicYear === yearFilter),
    [allExams, yearFilter]
  );
  const ruleList = useMemo(() => (rules?.data ?? []) as RuleRow[], [rules?.data]);
  const [weights, setWeights] = useState<Record<string, number | "">>({});
  const duplicates = duplicateExamLabels(exams);
  const year = yearFilter || exams[0]?.academicYear || exam.academicYear;
  const activeRule = matchingRule(ruleList, year, formulaClassId);
  const studentList = (students?.data ?? []) as Array<{ _id: string; name: string; studentId: string }>;

  useEffect(() => {
    if (session?.data.settings?.academicYear) {
      setYearFilter((prev) => prev || session.data.settings.academicYear);
      setExam((prev) => ({ ...prev, academicYear: prev.academicYear || session.data.settings.academicYear }));
    }
  }, [session?.data.settings?.academicYear]);

  useEffect(() => {
    if (!exams.length) {
      setWeights({});
      return;
    }
    const active = matchingRule(ruleList, year, formulaClassId);
    const next: Record<string, number | ""> = {};
    exams.forEach((item, index) => {
      const match = active?.weights.find((row) => examWeightId(row.examTypeId) === item._id);
      if (match) next[item._id] = match.weight;
      else if (active) next[item._id] = "";
      else {
        const equal = Math.floor(100 / exams.length);
        next[item._id] = index === exams.length - 1 ? 100 - equal * (exams.length - 1) : equal;
      }
    });
    setWeights(next);
  }, [exams, formulaClassId, ruleList, year]);

  const total = useMemo(() => Object.values(weights).reduce<number>((sum, value) => sum + Number(value || 0), 0), [weights]);
  const totalOk = Math.abs(total - 100) < 0.01;

  return (
    <div>
      <PageHeader title={t.exams.title} subtitle={t.exams.subtitle} />
      <div className="mb-4 max-w-xs">
        <Field label={t.exams.filterYear} htmlFor="exam-year-filter">
          <Select id="exam-year-filter" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <WorkspaceTabs
        tabs={[
          { id: "list", label: t.exams.tabList },
          { id: "formula", label: t.exams.tabFormula },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "list" ? (
        <>
          {duplicates.length ? (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {t.exams.duplicateWarn} {duplicates.join(" · ")}
            </p>
          ) : null}
          <FormPanel
            className="md:grid-cols-3 lg:grid-cols-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await createExam({
                ...exam,
                startDate: exam.startDate || undefined,
                endDate: exam.endDate || undefined,
              });
              if (!toastApiResult(result, t.exams.addExam, t.common.loadError)) return;
              setExam({ name: "", code: "", academicYear: exam.academicYear, startDate: "", endDate: "" });
            }}
          >
            <Field label={t.exams.examName} htmlFor="exam-name">
              <Input
                id="exam-name"
                value={exam.name}
                placeholder={t.exams.examNameHint}
                onChange={(e) => setExam({ ...exam, name: e.target.value })}
              />
            </Field>
            <Field label={t.common.code} htmlFor="exam-code">
              <Input id="exam-code" value={exam.code} onChange={(e) => setExam({ ...exam, code: e.target.value })} />
            </Field>
            <Field label={t.common.year} htmlFor="exam-year">
              <Input
                id="exam-year"
                value={exam.academicYear}
                onChange={(e) => setExam({ ...exam, academicYear: e.target.value })}
              />
            </Field>
            <Field label={t.exams.startDate} htmlFor="exam-start">
              <Input
                id="exam-start"
                type="date"
                value={exam.startDate}
                onChange={(e) => setExam({ ...exam, startDate: e.target.value })}
              />
            </Field>
            <Field label={t.exams.endDate} htmlFor="exam-end">
              <Input
                id="exam-end"
                type="date"
                value={exam.endDate}
                onChange={(e) => setExam({ ...exam, endDate: e.target.value })}
              />
            </Field>
            <Button type="submit">{t.exams.addExam}</Button>
          </FormPanel>
          {isLoading ? <TableSkeleton /> : null}
          {isError ? <QueryError onRetry={refetch} /> : null}
          {!isLoading && !exams.length ? <EmptyState title={t.exams.empty} /> : null}
          <DataTable
            rows={exams}
            rowKey={(row) => row._id}
            columns={[
              { header: t.exams.examName, cell: (row) => row.name },
              { header: t.common.code, cell: (row) => row.code },
              { header: t.common.year, cell: (row) => row.academicYear },
              {
                header: t.exams.startDate,
                cell: (row) => (row.startDate ? new Date(row.startDate).toLocaleDateString() : "—"),
              },
              {
                header: t.exams.endDate,
                cell: (row) => (row.endDate ? new Date(row.endDate).toLocaleDateString() : "—"),
              },
              { header: t.common.status, cell: (row) => (row.isPublished ? t.common.published : t.common.draft) },
            ]}
            actions={(row) => [
              ...(canPublish
                ? [
                    {
                      label: row.isPublished ? t.common.draft : t.common.publish,
                      onClick: async () =>
                        toastApiResult(
                          await publishExam({ id: row._id, isPublished: !row.isPublished }),
                          t.common.save,
                          t.common.loadError
                        ),
                    },
                  ]
                : []),
              { label: t.common.edit, onClick: () => setEdit(row) },
              { label: t.common.delete, danger: true, onClick: () => setRemoveId(row._id) },
            ]}
          />
        </>
      ) : null}

      {tab === "formula" ? (
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold">{t.exams.formula}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.exams.formulaHint}</p>
          {!exams.length ? (
            <EmptyState title={t.exams.needExam} />
          ) : (
            <>
              <div className="mt-3 max-w-sm">
                <Field label={t.exams.perClass}>
                  <select
                    className="h-11 w-full rounded-md border px-3 text-sm"
                    value={formulaClassId}
                    onChange={(e) => setFormulaClassId(e.target.value)}
                  >
                    <option value="">{t.exams.yearDefault}</option>
                    {((classes?.data ?? []) as Array<{ _id: string; name: string }>).map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="mt-4 space-y-3">
                {exams.map((item) => (
                  <div key={item._id} className="grid items-center gap-3 sm:grid-cols-[1fr_8rem_6rem]">
                    <p className="text-sm font-medium">{item.name}</p>
                    <Field label={t.exams.weightPct} htmlFor={`w-${item._id}`}>
                      <Input
                        id={`w-${item._id}`}
                        type="number"
                        min={0}
                        max={100}
                        value={weights[item._id] ?? ""}
                        onChange={(e) =>
                          setWeights((prev) => ({
                            ...prev,
                            [item._id]: e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                      />
                    </Field>
                    <div className="h-2 overflow-hidden rounded bg-muted">
                      <div
                        className={cn("h-full bg-primary transition-all")}
                        style={{ width: `${Math.min(100, Number(weights[item._id] || 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-sm">
                  <span className={cn("font-medium", totalOk ? "text-primary" : "text-red-700")}>
                    {t.exams.total}: {total}%
                  </span>
                  {!totalOk ? <span className="text-red-700">{t.exams.needHundred}</span> : null}
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full transition-all", totalOk ? "bg-primary" : "bg-red-600")}
                    style={{ width: `${Math.min(100, total)}%` }}
                  />
                </div>
              </div>
              <Button
                className="mt-4"
                disabled={!totalOk}
                onClick={async () => {
                  if (!exams.length) return toast.error(t.exams.needExam);
                  if (!totalOk) return toast.error(t.exams.needHundred);
                  const result = await createRule({
                    name: formulaClassId ? "Class formula" : "Annual formula",
                    academicYear: year,
                    scale: "gpa5",
                    isDefault: !formulaClassId,
                    classId: formulaClassId || undefined,
                    weights: exams
                      .map((item) => ({ examTypeId: item._id, weight: Number(weights[item._id] || 0) }))
                      .filter((row) => row.weight > 0),
                  });
                  toastApiResult(result, t.exams.saveFormula, t.common.loadError);
                }}
              >
                {t.exams.saveFormula}
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">
                {t.exams.activeFormula}: {activeRule?.name ?? t.exams.none} ({year})
              </p>

              <div className="mt-8 border-t border-border pt-6">
                <h3 className="font-semibold">{t.exams.finalPreview}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.exams.finalPreviewHint}</p>
                <div className="mt-3 max-w-md">
                  <Field label={t.exams.pickStudentPreview} htmlFor="final-student">
                    <Select id="final-student" value={previewStudentId} onChange={(e) => setPreviewStudentId(e.target.value)}>
                      <option value="">{t.exams.pickStudentPreview}</option>
                      {studentList.slice(0, 200).map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name} · {item.studentId}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                {previewStudentId ? (
                  <p className="mt-3 text-sm">
                    {t.exams.finalGpa}:{" "}
                    <strong>
                      {finalLoading
                        ? "…"
                        : finalData?.data?.finalGpa != null
                          ? Number(finalData.data.finalGpa).toFixed(2)
                          : "—"}
                    </strong>
                  </p>
                ) : null}
              </div>
            </>
          )}
        </section>
      ) : null}

      <Dialog open={Boolean(edit)} title={t.exams.editExam} onClose={() => setEdit(null)}>
        {edit ? (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await updateExam({
                id: edit._id,
                name: edit.name,
                code: edit.code,
                startDate: toDateInput(edit.startDate) || undefined,
                endDate: toDateInput(edit.endDate) || undefined,
              });
              if (toastApiResult(result, t.common.save, t.common.loadError)) setEdit(null);
            }}
          >
            <Field label={t.exams.examName}>
              <Input value={edit.name} placeholder={t.exams.examNameHint} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label={t.common.code}>
              <Input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value })} />
            </Field>
            <Field label={t.exams.startDate}>
              <Input
                type="date"
                value={toDateInput(edit.startDate)}
                onChange={(e) => setEdit({ ...edit, startDate: e.target.value })}
              />
            </Field>
            <Field label={t.exams.endDate}>
              <Input
                type="date"
                value={toDateInput(edit.endDate)}
                onChange={(e) => setEdit({ ...edit, endDate: e.target.value })}
              />
            </Field>
            <Button type="submit">{t.common.save}</Button>
          </form>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={Boolean(removeId)}
        title={t.common.delete}
        message={t.exams.deleteAsk}
        danger
        onClose={() => setRemoveId(null)}
        onConfirm={async () => {
          if (!removeId) return;
          toastApiResult(await deleteExam(removeId), t.common.delete, t.common.loadError);
          setRemoveId(null);
        }}
      />
    </div>
  );
}
