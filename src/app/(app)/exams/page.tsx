"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable, FormPanel } from "@/components/data-table";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input } from "@/components/ui";
import {
  useCreateExamMutation,
  useCreateRuleMutation,
  useDeleteExamMutation,
  useGetClassesQuery,
  useGetExamsQuery,
  useGetRulesQuery,
  useUpdateExamMutation,
} from "@/lib/api/schoolApi";
import { usePublishExamMutation } from "@/lib/api/workspaceApi";
import { duplicateExamLabels } from "@/lib/exam-names";
import { useI18n } from "@/lib/i18n";

type ExamRow = { _id: string; name: string; code: string; academicYear: string; isPublished?: boolean };
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

export default function ExamsPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetExamsQuery();
  const { data: rules } = useGetRulesQuery();
  const [createExam] = useCreateExamMutation();
  const [updateExam] = useUpdateExamMutation();
  const [deleteExam] = useDeleteExamMutation();
  const [createRule] = useCreateRuleMutation();
  const [publishExam] = usePublishExamMutation();
  const { data: classes } = useGetClassesQuery();
  const [formulaClassId, setFormulaClassId] = useState("");
  const [exam, setExam] = useState({ name: "", code: "", academicYear: "2026" });
  const [edit, setEdit] = useState<ExamRow | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const exams = useMemo(() => (data?.data ?? []) as ExamRow[], [data?.data]);
  const ruleList = useMemo(() => (rules?.data ?? []) as RuleRow[], [rules?.data]);
  const [weights, setWeights] = useState<Record<string, number | "">>({});
  const duplicates = duplicateExamLabels(exams);
  const year = exams[0]?.academicYear ?? exam.academicYear;
  const activeRule = matchingRule(ruleList, year, formulaClassId);

  useEffect(() => {
    if (!exams.length) return;
    const active = matchingRule(ruleList, exams[0]?.academicYear ?? "", formulaClassId);
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
    setWeights((prev) => {
      const keys = Object.keys(next);
      if (keys.length === Object.keys(prev).length && keys.every((key) => prev[key] === next[key])) return prev;
      return next;
    });
  }, [exams, formulaClassId, ruleList]);

  const total = useMemo(() => Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0), [weights]);
  const totalOk = Math.abs(total - 100) < 0.01;

  return (
    <div>
      <PageHeader title={t.exams.title} subtitle={t.exams.subtitle} />
      {duplicates.length ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {t.exams.duplicateWarn} {duplicates.join(" · ")}
        </p>
      ) : null}
      <FormPanel
        className="md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await createExam(exam);
          if (!toastApiResult(result, t.exams.addExam, t.common.loadError)) return;
          setExam({ name: "", code: "", academicYear: exam.academicYear });
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
          <Input id="exam-year" value={exam.academicYear} onChange={(e) => setExam({ ...exam, academicYear: e.target.value })} />
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
          { header: t.common.status, cell: (row) => (row.isPublished ? t.common.published : t.common.draft) },
        ]}
        actions={(row) => [
          {
            label: row.isPublished ? t.common.draft : t.common.publish,
            onClick: async () => toastApiResult(await publishExam({ id: row._id, isPublished: !row.isPublished }), t.common.save),
          },
          { label: t.common.edit, onClick: () => setEdit(row) },
          { label: t.common.delete, danger: true, onClick: () => setRemoveId(row._id) },
        ]}
      />
      {exams.length ? (
        <section className="mt-8 rounded-xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold">{t.exams.formula}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.exams.formulaHint}</p>
          <div className="mt-3 max-w-sm">
            <Field label={t.exams.perClass}>
              <select className="h-11 w-full rounded-md border px-3 text-sm" value={formulaClassId} onChange={(e) => setFormulaClassId(e.target.value)}>
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
              <div key={item._id} className="grid items-center gap-3 sm:grid-cols-[1fr_8rem]">
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
              </div>
            ))}
          </div>
          <p className={`mt-4 text-sm font-medium ${totalOk ? "text-primary" : "text-red-700"}`}>
            {t.exams.total}: {total}%{totalOk ? "" : ` — ${t.exams.needHundred}`}
          </p>
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
            {t.exams.activeFormula}: {activeRule?.name ?? t.exams.none}
          </p>
        </section>
      ) : null}
      <Dialog open={Boolean(edit)} title={t.exams.editExam} onClose={() => setEdit(null)}>
        {edit ? (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await updateExam({ id: edit._id, name: edit.name, code: edit.code });
              if (toastApiResult(result, t.common.save, t.common.loadError)) setEdit(null);
            }}
          >
            <Field label={t.exams.examName}>
              <Input value={edit.name} placeholder={t.exams.examNameHint} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label={t.common.code}>
              <Input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value })} />
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
