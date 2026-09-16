"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-state";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { useCreateStudentMutation, useGetClassesQuery, useMeQuery } from "@/lib/api/schoolApi";
import { formatStudentAddress } from "@/lib/address";
import { classFamilies, classFamilyLabel, resolveClassMember, type ClassRow } from "@/lib/class-families";
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
  const [familyLabel, setFamilyLabel] = useState("");
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
    address: { division: "", district: "", upazila: "", area: "", road: "", holding: "", block: "" },
    guardian: { fatherName: "", motherName: "", guardianName: "", relation: "Father", nid: "", phone: "", occupation: "" },
    talentTags: "",
  });

  const classList = (classes?.data ?? []) as ClassRow[];
  const families = useMemo(() => classFamilies(classList), [classList]);
  const family = families.find((item) => item.label === familyLabel);
  const needsGroup = Boolean(family && family.groups.length);
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

  function applyClass(nextLabel: string, nextGroup: string) {
    const resolved = resolveClassMember(classList, nextLabel, nextGroup);
    const nextSections = sectionNames(resolved?.sections as never);
    setFamilyLabel(nextLabel);
    setForm((prev) => ({
      ...prev,
      classId: resolved?._id ?? "",
      group: resolved?.group && resolved.group !== "None" ? resolved.group : "None",
      section: nextSections[0] ?? "A",
    }));
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
                value={familyLabel}
                onChange={(e) => {
                  const next = families.find((item) => item.label === e.target.value);
                  applyClass(e.target.value, next?.groups[0] ?? "None");
                }}
              >
                <option value="">{t.common.class}</option>
                {families.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label}
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
            {needsGroup ? (
              <Field label={t.common.group}>
                <Select value={form.group} onChange={(e) => applyClass(familyLabel, e.target.value)}>
                  {family?.groups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label={t.common.year}>
              <Input value={form.academicYear} onChange={(e) => set("academicYear", e.target.value)} />
            </Field>
            <Field label={t.students.talentTags}>
              <Input value={form.talentTags} onChange={(e) => set("talentTags", e.target.value)} placeholder={t.students.talentHint} />
            </Field>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <p className="md:col-span-2 text-sm text-muted-foreground">{t.students.addressHint}</p>
            <Field label={t.reports.division}>
              <Input value={form.address.division} onChange={(e) => set("address", { ...form.address, division: e.target.value })} />
            </Field>
            <Field label={t.reports.district}>
              <Input value={form.address.district} onChange={(e) => set("address", { ...form.address, district: e.target.value })} />
            </Field>
            <Field label={t.reports.upazila}>
              <Input value={form.address.upazila} onChange={(e) => set("address", { ...form.address, upazila: e.target.value })} />
            </Field>
            <Field label={t.students.locality}>
              <Input value={form.address.area} onChange={(e) => set("address", { ...form.address, area: e.target.value })} />
            </Field>
            <Field label={t.students.road}>
              <Input value={form.address.road} onChange={(e) => set("address", { ...form.address, road: e.target.value })} />
            </Field>
            <Field label={t.students.holding}>
              <Input value={form.address.holding} onChange={(e) => set("address", { ...form.address, holding: e.target.value })} />
            </Field>
            <Field label={t.students.block}>
              <Input value={form.address.block} onChange={(e) => set("address", { ...form.address, block: e.target.value })} />
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
            <Field label={t.common.relation}>
              <Select value={form.guardian.relation} onChange={(e) => set("guardian", { ...form.guardian, relation: e.target.value })}>
                <option value="Father">{t.common.father}</option>
                <option value="Mother">{t.common.mother}</option>
                <option value="Other">{t.common.other}</option>
              </Select>
            </Field>
            <Field label={`${t.common.guardian} NID`}>
              <Input value={form.guardian.nid} onChange={(e) => set("guardian", { ...form.guardian, nid: e.target.value })} />
            </Field>
            <Field label={`${t.common.guardian} ${t.common.phone}`}>
              <Input value={form.guardian.phone} onChange={(e) => set("guardian", { ...form.guardian, phone: e.target.value })} />
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
              {selectedClass ? classFamilyLabel(selectedClass.name) : "—"}
              {form.group !== "None" ? ` · ${form.group}` : ""} · {form.section} · {form.phone || "—"}
            </p>
            <p>{formatStudentAddress(form.address) || "—"}</p>
            <p>
              {t.common.guardian}: {form.guardian.fatherName || form.guardian.guardianName || "—"} ({form.guardian.relation}) (
              {form.guardian.phone || "—"})
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
