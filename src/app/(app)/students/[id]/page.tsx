"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { Sheet } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { QueryError, TableSkeleton } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { useUpdateStudentMutation } from "@/lib/api/peopleApi";
import { useGetClassesQuery, useGetStudentQuery } from "@/lib/api/schoolApi";
import { formatStudentAddress } from "@/lib/address";
import { classFamilies, classFamilyLabel, resolveClassMember, type ClassRow } from "@/lib/class-families";
import { sectionNames } from "@/lib/sections";
import { studentStatusTone } from "@/lib/status";
import { useI18n } from "@/lib/i18n";

type Student = {
  _id: string;
  name: string;
  nameBn?: string;
  studentId: string;
  phone?: string;
  email?: string;
  gender?: string;
  bloodGroup?: string;
  religion?: string;
  section?: string;
  group?: string;
  status?: string;
  academicYear?: string;
  previousSchool?: string;
  healthNotes?: string;
  talentTags?: string[];
  classId?: { _id?: string; name?: string; sections?: unknown; group?: string };
  address?: { division?: string; district?: string; upazila?: string; area?: string; road?: string; holding?: string; block?: string };
  guardian?: { fatherName?: string; motherName?: string; phone?: string; nid?: string; occupation?: string; relation?: string };
};

function statusLabel(t: ReturnType<typeof useI18n>["t"], status?: string) {
  if (status === "pending") return t.common.pending;
  if (status === "alumni") return t.common.alumni;
  if (status === "transferred") return t.common.transferred;
  return t.common.active;
}

function StudentProfileInner() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { data, isLoading, isError, refetch } = useGetStudentQuery(params.id);
  const { data: classes } = useGetClassesQuery();
  const [updateStudent, { isLoading: saving }] = useUpdateStudentMutation();
  const student = data?.data as Student | undefined;
  const [open, setOpen] = useState(search.get("edit") === "1");
  const [familyLabel, setFamilyLabel] = useState("");
  const [form, setForm] = useState({
    name: "",
    nameBn: "",
    phone: "",
    classId: "",
    section: "A",
    status: "active",
    group: "None",
    relation: "Father",
    healthNotes: "",
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

  useEffect(() => {
    if (!student) return;
    const className = student.classId?.name ?? "";
    setFamilyLabel(className ? classFamilyLabel(className) : "");
    setForm({
      name: student.name ?? "",
      nameBn: student.nameBn ?? "",
      phone: student.phone ?? "",
      classId: student.classId?._id ?? "",
      section: student.section ?? "A",
      status: student.status ?? "active",
      group: student.group ?? student.classId?.group ?? "None",
      relation: student.guardian?.relation ?? "Father",
      healthNotes: student.healthNotes ?? "",
      talentTags: (student.talentTags ?? []).join(", "),
    });
    if (search.get("edit") === "1") setOpen(true);
  }, [search, student]);

  function applyClass(nextLabel: string, nextGroup: string) {
    const resolved = resolveClassMember(classList, nextLabel, nextGroup);
    const nextSections = sectionNames(resolved?.sections as never);
    setFamilyLabel(nextLabel);
    setForm((prev) => ({
      ...prev,
      classId: resolved?._id ?? "",
      group: resolved?.group && resolved.group !== "None" ? resolved.group : "None",
      section: nextSections.includes(prev.section) ? prev.section : (nextSections[0] ?? "A"),
    }));
  }

  if (isLoading) return <TableSkeleton />;
  if (isError || !student) return <QueryError onRetry={refetch} />;

  const displayClass = student.classId?.name ? classFamilyLabel(student.classId.name) : "";

  return (
    <div>
      <PageHeader
        title={student.name}
        subtitle={`${student.studentId} · ${displayClass} ${student.group && student.group !== "None" ? student.group : ""} ${student.section ?? ""}`}
        actions={
          <>
            <StatusBadge label={statusLabel(t, student.status)} tone={studentStatusTone(student.status)} />
            <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
              {t.students.editProfile}
            </Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">{t.students.contact}</h2>
          <p className="mt-2 text-sm">{student.phone || "—"}</p>
          <p className="text-sm text-muted-foreground">{formatStudentAddress(student.address) || "—"}</p>
          <p className="mt-2 text-sm">
            {t.common.blood}: {student.bloodGroup || "—"} · {t.common.religion}: {student.religion || "—"}
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">{t.common.guardian}</h2>
          <p className="mt-2 text-sm">
            {student.guardian?.fatherName || "—"} · {t.common.relation}: {student.guardian?.relation || "—"} · {student.guardian?.phone || "—"}
          </p>
          <p className="text-sm text-muted-foreground">NID: {student.guardian?.nid || "—"}</p>
          <p className="text-sm">{student.guardian?.occupation || ""}</p>
        </Card>
        <Card>
          <h2 className="font-semibold">{t.students.talentTags}</h2>
          <p className="mt-2 text-sm">{student.talentTags?.length ? student.talentTags.join(", ") : t.talent.empty}</p>
          <p className="mt-2 text-sm text-muted-foreground">{student.healthNotes || t.common.health}</p>
        </Card>
        <Card>
          <h2 className="font-semibold">{t.common.actions}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/fees/dues?studentId=${student._id}`}>
              <Button variant="secondary">{t.nav.feeDues}</Button>
            </Link>
            <Link href={`/fees/collected`}>
              <Button variant="secondary">{t.nav.feeCollected}</Button>
            </Link>
            <Link href={`/results`}>
              <Button variant="secondary">{t.nav.results}</Button>
            </Link>
            <Link href="/id-cards">
              <Button variant="secondary">{t.nav.idCards}</Button>
            </Link>
          </div>
        </Card>
      </div>
      <Sheet open={open} title={t.students.editProfile} onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await updateStudent({
              id: student._id,
              name: form.name,
              nameBn: form.nameBn,
              phone: form.phone,
              classId: form.classId || undefined,
              section: form.section,
              status: form.status,
              group: form.group,
              healthNotes: form.healthNotes,
              talentTags: form.talentTags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
              guardian: { ...student.guardian, relation: form.relation },
            });
            if (toastApiResult(result, t.common.save, t.common.loadError)) setOpen(false);
          }}
        >
          <Field label={t.students.nameEn}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={t.students.nameBn}>
            <Input value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
          </Field>
          <Field label={t.common.phone}>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label={t.common.class}>
            <Select
              value={familyLabel}
              onChange={(e) => {
                const next = families.find((item) => item.label === e.target.value);
                applyClass(e.target.value, next?.groups[0] ?? "None");
              }}
            >
              {families.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
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
          <Field label={t.common.section}>
            <Select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
              {sections.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.common.relation}>
            <Select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
              <option value="Father">{t.common.father}</option>
              <option value="Mother">{t.common.mother}</option>
              <option value="Other">{t.common.other}</option>
            </Select>
          </Field>
          <Field label={t.common.status}>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t.common.active}</option>
              <option value="pending">{t.common.pending}</option>
              <option value="alumni">{t.common.alumni}</option>
              <option value="transferred">{t.common.transferred}</option>
            </Select>
          </Field>
          <Field label={t.students.talentTags}>
            <Input value={form.talentTags} onChange={(e) => setForm({ ...form, talentTags: e.target.value })} />
          </Field>
          <Field label={t.common.health}>
            <Textarea value={form.healthNotes} onChange={(e) => setForm({ ...form, healthNotes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button disabled={saving} type="submit">
              {t.common.save}
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <StudentProfileInner />
    </Suspense>
  );
}
