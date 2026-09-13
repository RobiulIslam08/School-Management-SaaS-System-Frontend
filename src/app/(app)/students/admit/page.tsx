"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-state";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { useCreateStudentMutation, useGetClassesQuery, useMeQuery } from "@/lib/api/schoolApi";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function AdmitPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: session } = useMeQuery();
  const { data: classes, isError: classesError, refetch: refetchClasses } = useGetClassesQuery();
  const [createStudent, { isLoading }] = useCreateStudentMutation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    nameBn: "",
    gender: "male",
    phone: "",
    bloodGroup: "",
    religion: "",
    classId: "",
    section: "A",
    group: "None",
    academicYear: session?.data.settings?.academicYear ?? "2026",
    previousSchool: "",
    healthNotes: "",
    address: { division: "", district: "", upazila: "", area: "" },
    guardian: { fatherName: "", motherName: "", guardianName: "", nid: "", phone: "", occupation: "" },
    talentTags: "",
  });

  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string; sections?: unknown }>;
  const sections = useMemo(
    () => sectionNames(classList.find((item) => item._id === form.classId)?.sections as never),
    [classList, form.classId]
  );
  const steps = [t.students.stepStudent, t.students.stepAddress, t.students.stepGuardian, t.students.stepReview];

  useEffect(() => {
    const year = session?.data.settings?.academicYear;
    if (year) setForm((prev) => ({ ...prev, academicYear: year }));
  }, [session?.data.settings?.academicYear]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canNext() {
    if (step === 0) return Boolean(form.name.trim() && form.classId);
    return true;
  }

  async function submit() {
    if (!form.name.trim() || !form.classId) return;
    const result = await createStudent({
      ...form,
      talentTags: form.talentTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    if (!toastApiResult(result, t.students.confirmAdmit, t.common.loadError)) return;
    router.push("/students");
  }

  const selectedClass = classList.find((item) => item._id === form.classId);

  return (
    <div>
      <PageHeader title={t.students.admitTitle} subtitle={t.students.admitHint} />
      {classesError ? <QueryError onRetry={refetchClasses} /> : null}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-sm font-medium",
              index === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
            onClick={() => setStep(index)}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>
      <Card className="max-w-3xl space-y-4">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.students.nameEn}>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label={t.students.nameBn}>
              <Input value={form.nameBn} onChange={(e) => set("nameBn", e.target.value)} />
            </Field>
            <Field label={t.students.gender}>
              <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="male">{t.common.male}</option>
                <option value="female">{t.common.female}</option>
                <option value="other">{t.common.other}</option>
              </Select>
            </Field>
            <Field label={t.common.phone}>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label={t.common.class}>
              <Select
                value={form.classId}
                onChange={(e) => {
                  const next = sectionNames(classList.find((item) => item._id === e.target.value)?.sections as never);
                  setForm((prev) => ({ ...prev, classId: e.target.value, section: next[0] ?? "A" }));
                }}
              >
                <option value="">{t.common.class}</option>
                {classList.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.common.section}>
              <Select value={form.section} onChange={(e) => set("section", e.target.value)}>
                {sections.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.common.group}>
              <Select value={form.group} onChange={(e) => set("group", e.target.value)}>
                <option value="None">None</option>
                <option value="Science">Science</option>
                <option value="Business">Business</option>
                <option value="Humanities">Humanities</option>
              </Select>
            </Field>
            <Field label={t.common.year}>
              <Input value={form.academicYear} onChange={(e) => set("academicYear", e.target.value)} />
            </Field>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.reports.division}>
              <Input value={form.address.division} onChange={(e) => set("address", { ...form.address, division: e.target.value })} />
            </Field>
            <Field label={t.reports.district}>
              <Input value={form.address.district} onChange={(e) => set("address", { ...form.address, district: e.target.value })} />
            </Field>
            <Field label={t.reports.upazila}>
              <Input value={form.address.upazila} onChange={(e) => set("address", { ...form.address, upazila: e.target.value })} />
            </Field>
            <Field label={t.reports.area}>
              <Input value={form.address.area} onChange={(e) => set("address", { ...form.address, area: e.target.value })} />
            </Field>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.common.father}>
              <Input value={form.guardian.fatherName} onChange={(e) => set("guardian", { ...form.guardian, fatherName: e.target.value })} />
            </Field>
            <Field label={t.common.mother}>
              <Input value={form.guardian.motherName} onChange={(e) => set("guardian", { ...form.guardian, motherName: e.target.value })} />
            </Field>
            <Field label={`${t.common.guardian} NID`}>
              <Input value={form.guardian.nid} onChange={(e) => set("guardian", { ...form.guardian, nid: e.target.value })} />
            </Field>
            <Field label={`${t.common.guardian} ${t.common.phone}`}>
              <Input value={form.guardian.phone} onChange={(e) => set("guardian", { ...form.guardian, phone: e.target.value })} />
            </Field>
            <Field label={t.common.tags}>
              <Input value={form.talentTags} onChange={(e) => set("talentTags", e.target.value)} placeholder={t.students.talentHint} />
            </Field>
            <Field label={t.common.previousSchool}>
              <Input value={form.previousSchool} onChange={(e) => set("previousSchool", e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label={t.common.health}>
                <Textarea value={form.healthNotes} onChange={(e) => set("healthNotes", e.target.value)} />
              </Field>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="space-y-2 text-sm leading-7">
            <p className="text-lg font-semibold">{form.name || "—"}</p>
            <p>
              {selectedClass?.name ?? "—"} · {form.section} · {form.phone || "—"}
            </p>
            <p>
              {form.address.district || "—"}, {form.address.upazila || "—"}, {form.address.area || "—"}
            </p>
            <p>
              {t.common.guardian}: {form.guardian.fatherName || form.guardian.guardianName || "—"} ({form.guardian.phone || "—"})
            </p>
          </div>
        ) : null}
        <div className="flex justify-between pt-2">
          <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            {t.common.back}
          </Button>
          {step < 3 ? (
            <Button type="button" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
              {t.common.next}
            </Button>
          ) : (
            <Button type="button" disabled={isLoading || !canNext()} onClick={submit}>
              {t.students.confirmAdmit}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
