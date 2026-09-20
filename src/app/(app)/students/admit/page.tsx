"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { toastApiResult } from "@/lib/toast-api";
import { AdmissionFormDocument } from "@/components/admission-form-document";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-state";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { useCreateStudentMutation, useGetClassesQuery, useMeQuery } from "@/lib/api/schoolApi";
import { classFamilies, classFamilyLabel, resolveClassMember, type ClassRow } from "@/lib/class-families";
import { sectionNames } from "@/lib/sections";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

const emptyAddress = () => ({
  division: "",
  district: "",
  upazila: "",
  area: "",
  road: "",
  holding: "",
  block: "",
  postOffice: "",
});

type CreatedStudent = {
  _id: string;
  studentId: string;
  name: string;
  nameBn?: string;
  photoUrl?: string;
  email?: string;
  dob?: string;
  birthRegNo?: string;
  bloodGroup?: string;
  religion?: string;
  phone?: string;
  section?: string;
  group?: string;
  academicYear?: string;
  address?: Record<string, string>;
  permanentAddress?: Record<string, string>;
  guardian?: Record<string, string>;
  classId?: { name?: string } | string;
};

export default function AdmitPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const { data: classes, isError: classesError, refetch: refetchClasses } = useGetClassesQuery();
  const [createStudent, { isLoading }] = useCreateStudentMutation();
  const [step, setStep] = useState(0);
  const [familyLabel, setFamilyLabel] = useState("");
  const [samePermanent, setSamePermanent] = useState(true);
  const [created, setCreated] = useState<CreatedStudent | null>(null);
  const [form, setForm] = useState({
    name: "",
    nameBn: "",
    gender: "male",
    phone: "",
    email: "",
    dob: "",
    birthRegNo: "",
    bloodGroup: "",
    religion: "",
    photoUrl: "",
    classId: "",
    section: "A",
    group: "None",
    academicYear: session?.data.settings?.academicYear ?? "2026",
    address: emptyAddress(),
    permanentAddress: emptyAddress(),
    guardian: {
      fatherName: "",
      fatherNameBn: "",
      motherName: "",
      motherNameBn: "",
      guardianName: "",
      guardianNameBn: "",
      relation: "Father",
      nid: "",
      phone: "",
      fatherPhone: "",
      motherPhone: "",
      occupation: "",
    },
    talentTags: "",
  });

  const settings = session?.data.settings;
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

  function onPhoto(file: File | undefined) {
    if (!file) return;
    if (file.size > PHOTO_MAX_BYTES) {
      toast.error(t.students.photoTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") set("photoUrl", reader.result);
    };
    reader.readAsDataURL(file);
  }

  function canNext() {
    if (step === 0) return Boolean(form.name.trim() && form.classId && form.photoUrl && form.birthRegNo.trim());
    return true;
  }

  function courseLabel() {
    const selected = classList.find((item) => item._id === form.classId);
    const label = selected ? classFamilyLabel(selected.name) : "";
    const parts = [label, form.group !== "None" ? form.group : "", form.section].filter(Boolean);
    return parts.join(" · ");
  }

  function formDocData(overrides?: Partial<CreatedStudent>) {
    const row = { ...form, ...overrides };
    const permanent = samePermanent ? form.address : form.permanentAddress;
    return {
      studentId: overrides?.studentId,
      name: row.name,
      nameBn: row.nameBn,
      phone: row.phone,
      email: row.email,
      dob: row.dob,
      birthRegNo: row.birthRegNo,
      religion: row.religion,
      bloodGroup: row.bloodGroup,
      photoUrl: row.photoUrl || overrides?.photoUrl,
      courseName: courseLabel(),
      fatherName: form.guardian.fatherName,
      fatherNameBn: form.guardian.fatherNameBn,
      fatherPhone: form.guardian.fatherPhone,
      motherName: form.guardian.motherName,
      motherNameBn: form.guardian.motherNameBn,
      motherPhone: form.guardian.motherPhone,
      address: form.address,
      permanentAddress: permanent,
    };
  }

  async function submit() {
    if (!form.name.trim() || !form.classId) return;
    if (!form.photoUrl) {
      toast.error(t.students.needPhoto);
      return;
    }
    if (!form.birthRegNo.trim()) {
      toast.error(t.students.needBirthReg);
      return;
    }
    const permanentAddress = samePermanent ? form.address : form.permanentAddress;
    const guardian = {
      ...form.guardian,
      phone: form.guardian.fatherPhone || form.guardian.phone,
    };
    const result = await createStudent({
      ...form,
      permanentAddress,
      guardian,
      talentTags: form.talentTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    if (!toastApiResult(result, t.students.confirmAdmit, t.common.loadError)) return;
    const data = (result as { data?: { data?: CreatedStudent } }).data?.data;
    if (data) setCreated(data);
  }

  function resetForm() {
    setCreated(null);
    setStep(0);
    setFamilyLabel("");
    setSamePermanent(true);
    setForm((prev) => ({
      ...prev,
      name: "",
      nameBn: "",
      phone: "",
      email: "",
      dob: "",
      birthRegNo: "",
      bloodGroup: "",
      religion: "",
      photoUrl: "",
      classId: "",
      section: "A",
      group: "None",
      address: emptyAddress(),
      permanentAddress: emptyAddress(),
      guardian: {
        fatherName: "",
        fatherNameBn: "",
        motherName: "",
        motherNameBn: "",
        guardianName: "",
        guardianNameBn: "",
        relation: "Father",
        nid: "",
        phone: "",
        fatherPhone: "",
        motherPhone: "",
        occupation: "",
      },
      talentTags: "",
    }));
  }

  if (created) {
    const className =
      typeof created.classId === "object" && created.classId?.name
        ? classFamilyLabel(created.classId.name)
        : courseLabel();
    return (
      <div className="admission-print-root">
        <div className="no-print mb-6">
          <PageHeader
            title={t.students.admissionSlip}
            subtitle={`${t.students.assignedId}: ${created.studentId}`}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => window.print()}>
                  {t.students.downloadPdf}
                </Button>
                <Link href={`/students/${created._id}`}>
                  <Button type="button" variant="secondary">
                    {t.students.viewProfile}
                  </Button>
                </Link>
                <Button type="button" onClick={resetForm}>
                  {t.students.admitAnother}
                </Button>
              </div>
            }
          />
        </div>
        <AdmissionFormDocument
          settings={settings}
          data={{
            ...formDocData(created),
            studentId: created.studentId,
            courseName: className,
            dob: created.dob ? new Date(created.dob).toLocaleDateString() : form.dob,
            address: created.address ?? form.address,
            permanentAddress: created.permanentAddress ?? (samePermanent ? form.address : form.permanentAddress),
            fatherName: created.guardian?.fatherName || form.guardian.fatherName,
            fatherPhone: created.guardian?.fatherPhone || form.guardian.fatherPhone,
            motherName: created.guardian?.motherName || form.guardian.motherName,
            motherPhone: created.guardian?.motherPhone || form.guardian.motherPhone,
            photoUrl: created.photoUrl || form.photoUrl,
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t.students.admitTitle} subtitle={t.students.admitHint} />
      {classesError ? <QueryError onRetry={refetchClasses} /> : null}
      <div className="mb-6 flex gap-2 overflow-x-auto no-print">
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

      <div className="no-print mb-8 max-w-4xl">
        <Card className="space-y-4">
          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 flex flex-wrap items-start gap-4">
                <div className="h-28 w-24 overflow-hidden border-2 border-foreground bg-muted">
                  {form.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <p className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                      {t.students.photo}
                    </p>
                  )}
                </div>
                <Field label={t.students.photoRequired}>
                  <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPhoto(e.target.files?.[0])} />
                  <p className="mt-1 text-xs text-muted-foreground">{t.students.photoHint}</p>
                </Field>
              </div>
              <Field label={t.students.studentName}>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>
              <Field label={t.students.nameBn}>
                <Input value={form.nameBn} onChange={(e) => set("nameBn", e.target.value)} />
              </Field>
              <Field label={t.common.phone}>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label={t.common.email}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label={t.students.dob}>
                <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </Field>
              <Field label={t.students.birthRegNo}>
                <Input value={form.birthRegNo} onChange={(e) => set("birthRegNo", e.target.value)} required />
              </Field>
              <Field label={t.common.religion}>
                <Input value={form.religion} onChange={(e) => set("religion", e.target.value)} />
              </Field>
              <Field label={t.common.blood}>
                <Input value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} />
              </Field>
              <Field label={t.students.gender}>
                <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="male">{t.common.male}</option>
                  <option value="female">{t.common.female}</option>
                  <option value="other">{t.common.other}</option>
                </Select>
              </Field>
              <Field label={t.students.courseName}>
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
              <p className="md:col-span-2 text-xs text-muted-foreground">{t.students.idWillAssign}</p>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-semibold">{t.students.presentAddress}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t.students.house}>
                    <Input value={form.address.holding} onChange={(e) => set("address", { ...form.address, holding: e.target.value })} />
                  </Field>
                  <Field label={t.students.village}>
                    <Input value={form.address.area} onChange={(e) => set("address", { ...form.address, area: e.target.value })} />
                  </Field>
                  <Field label={t.reports.upazila}>
                    <Input value={form.address.upazila} onChange={(e) => set("address", { ...form.address, upazila: e.target.value })} />
                  </Field>
                  <Field label={t.students.postOffice}>
                    <Input value={form.address.postOffice} onChange={(e) => set("address", { ...form.address, postOffice: e.target.value })} />
                  </Field>
                  <Field label={t.reports.district}>
                    <Input value={form.address.district} onChange={(e) => set("address", { ...form.address, district: e.target.value })} />
                  </Field>
                  <Field label={t.reports.division}>
                    <Input value={form.address.division} onChange={(e) => set("address", { ...form.address, division: e.target.value })} />
                  </Field>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={samePermanent} onChange={(e) => setSamePermanent(e.target.checked)} />
                {t.students.sameAsPresent}
              </label>
              {!samePermanent ? (
                <div>
                  <h3 className="mb-3 font-semibold">{t.students.permanentAddress}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label={t.students.house}>
                      <Input
                        value={form.permanentAddress.holding}
                        onChange={(e) => set("permanentAddress", { ...form.permanentAddress, holding: e.target.value })}
                      />
                    </Field>
                    <Field label={t.students.village}>
                      <Input
                        value={form.permanentAddress.area}
                        onChange={(e) => set("permanentAddress", { ...form.permanentAddress, area: e.target.value })}
                      />
                    </Field>
                    <Field label={t.reports.upazila}>
                      <Input
                        value={form.permanentAddress.upazila}
                        onChange={(e) => set("permanentAddress", { ...form.permanentAddress, upazila: e.target.value })}
                      />
                    </Field>
                    <Field label={t.students.postOffice}>
                      <Input
                        value={form.permanentAddress.postOffice}
                        onChange={(e) => set("permanentAddress", { ...form.permanentAddress, postOffice: e.target.value })}
                      />
                    </Field>
                    <Field label={t.reports.district}>
                      <Input
                        value={form.permanentAddress.district}
                        onChange={(e) => set("permanentAddress", { ...form.permanentAddress, district: e.target.value })}
                      />
                    </Field>
                    <Field label={t.reports.division}>
                      <Input
                        value={form.permanentAddress.division}
                        onChange={(e) => set("permanentAddress", { ...form.permanentAddress, division: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t.students.fatherNameLabel}>
                <Input value={form.guardian.fatherName} onChange={(e) => set("guardian", { ...form.guardian, fatherName: e.target.value })} />
              </Field>
              <Field label={t.students.fatherBn}>
                <Input value={form.guardian.fatherNameBn} onChange={(e) => set("guardian", { ...form.guardian, fatherNameBn: e.target.value })} />
              </Field>
              <Field label={t.students.fatherMobile}>
                <Input value={form.guardian.fatherPhone} onChange={(e) => set("guardian", { ...form.guardian, fatherPhone: e.target.value })} />
              </Field>
              <Field label={t.students.motherNameLabel}>
                <Input value={form.guardian.motherName} onChange={(e) => set("guardian", { ...form.guardian, motherName: e.target.value })} />
              </Field>
              <Field label={t.students.motherBn}>
                <Input value={form.guardian.motherNameBn} onChange={(e) => set("guardian", { ...form.guardian, motherNameBn: e.target.value })} />
              </Field>
              <Field label={t.students.motherMobile}>
                <Input value={form.guardian.motherPhone} onChange={(e) => set("guardian", { ...form.guardian, motherPhone: e.target.value })} />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <AdmissionFormDocument settings={settings} data={formDocData()} />
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
    </div>
  );
}
