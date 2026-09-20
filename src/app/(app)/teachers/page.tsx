"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog, Dialog, Sheet } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, Field, Input } from "@/components/ui";
import { useUpdateTeacherMutation } from "@/lib/api/peopleApi";
import { useCreateTeacherMutation, useGetSubjectsQuery, useGetTeachersQuery } from "@/lib/api/schoolApi";
import { activeTone } from "@/lib/status";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type SubjectItem = { _id?: string; name?: string; nameBn?: string; code?: string };

type TeacherRow = {
  _id: string;
  name: string;
  staffId: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  designation?: string;
  isActive?: boolean;
  joiningDate?: string;
  retirementDate?: string;
  salaryStructure?: { basic?: number; house?: number; medical?: number; other?: number };
  subjects?: SubjectItem[];
};

type AvailableSubject = {
  _id: string;
  name: string;
  nameBn: string;
  group: string;
  category: string;
  displayName: string;
};

function SubjectPicker({
  available,
  selectedIds,
  onChange,
  locale,
}: {
  available: AvailableSubject[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  locale: string;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return available.filter((sub) => {
      if (category !== "all" && sub.category !== category) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        sub.name.toLowerCase().includes(q) ||
        sub.nameBn.toLowerCase().includes(q) ||
        sub.displayName.toLowerCase().includes(q)
      );
    });
  }, [available, category, search]);

  const selectedSubjects = useMemo(() => {
    return available.filter((sub) => selectedIds.includes(sub._id));
  }, [available, selectedIds]);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id]
    );
  };

  const categories = [
    { id: "all", label: locale === "bn" ? `সবগুলো (${available.length})` : `All (${available.length})` },
    { id: "language", label: locale === "bn" ? "ভাষা ও সাহিত্য" : "Languages" },
    { id: "science", label: locale === "bn" ? "গণিত ও বিজ্ঞান" : "Science & Math" },
    { id: "business", label: locale === "bn" ? "ব্যবসায় শিক্ষা" : "Business" },
    { id: "humanities", label: locale === "bn" ? "মানবিক" : "Humanities" },
    { id: "religion", label: locale === "bn" ? "ধর্ম ও নৈতিক" : "Religion" },
    { id: "applied", label: locale === "bn" ? "ব্যবহারিক ও অন্যান্য" : "Applied & Electives" },
  ];

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={locale === "bn" ? "বিষয় খুঁজুন (যেমন: গণিত, পদার্থ, কৃষি, Accounting)..." : "Search subject (e.g. Math, Physics, Agri, Accounting)..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-7 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition",
              category === cat.id
                ? "bg-primary text-white shadow-xs"
                : "border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Selected Subjects Tag Box */}
      {selectedSubjects.length ? (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-2">
          <span className="text-[11px] font-semibold text-primary mr-1">
            {locale === "bn" ? `নির্বাচিত (${selectedSubjects.length}):` : `Selected (${selectedSubjects.length}):`}
          </span>
          {selectedSubjects.map((sub) => (
            <span
              key={sub._id}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-white shadow-xs"
            >
              <span>{locale === "bn" && sub.nameBn ? sub.nameBn : sub.name}</span>
              <button
                type="button"
                onClick={() => toggle(sub._id)}
                className="ml-0.5 text-white/80 hover:text-white"
                title={locale === "bn" ? "বাদ দিন" : "Remove"}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Badges Box */}
      <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2.5">
        {filtered.length ? (
          filtered.map((sub) => {
            const isSelected = selectedIds.includes(sub._id);
            return (
              <button
                key={sub._id}
                type="button"
                onClick={() => toggle(sub._id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition flex items-center gap-1.5",
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "border border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted"
                )}
              >
                <span>{sub.displayName}</span>
                <span className="text-[11px] opacity-75">{isSelected ? "✓" : "+"}</span>
              </button>
            );
          })
        ) : (
          <p className="w-full py-4 text-center text-xs text-muted-foreground">
            {locale === "bn" ? "কোনো বিষয় পাওয়া যায়নি" : "No subjects found"}
          </p>
        )}
      </div>
    </div>
  );
}

const PHOTO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  photoUrl: "",
  designation: "Teacher",
  joiningDate: "",
  retirementDate: "",
  basic: "" as string | number,
  medical: "" as string | number,
  other: "" as string | number,
  subjects: [] as string[],
};

export default function TeachersPage() {
  const { t, locale } = useI18n();
  const { data, isLoading, isError, refetch } = useGetTeachersQuery();
  const { data: subjectsData } = useGetSubjectsQuery();
  const [createTeacher] = useCreateTeacherMutation();
  const [updateTeacher, { isLoading: saving }] = useUpdateTeacherMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<TeacherRow | null>(null);
  const [confirm, setConfirm] = useState<TeacherRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const rows = (data?.data ?? []) as TeacherRow[];
  const active = rows.filter((row) => row.isActive !== false).length;
  const payroll = useMemo(
    () => rows.reduce((sum, row) => sum + (row.salaryStructure?.basic ?? 0), 0),
    [rows]
  );

  const rawSubjects = (subjectsData?.data ?? []) as Array<{
    _id: string;
    name: string;
    nameBn?: string;
    group?: string;
  }>;

  const availableSubjects = useMemo(() => {
    const map = new Map<string, AvailableSubject>();
    for (const sub of rawSubjects) {
      const name = (sub.name || "").trim();
      const nameBn = (sub.nameBn || "").trim();
      const key = name.toLowerCase();
      if (!key) continue;

      if (!map.has(key)) {
        let category = "applied";
        const low = name.toLowerCase();
        const lowBn = nameBn.toLowerCase();

        if (
          low.includes("bangla") ||
          low.includes("english") ||
          low.includes("arabic") ||
          lowBn.includes("বাংলা") ||
          lowBn.includes("ইংরেজি") ||
          lowBn.includes("আরবি")
        ) {
          category = "language";
        } else if (
          low.includes("math") ||
          low.includes("physics") ||
          low.includes("chem") ||
          low.includes("bio") ||
          low.includes("science") ||
          low.includes("ict") ||
          lowBn.includes("গণিত") ||
          lowBn.includes("পদার্থ") ||
          lowBn.includes("রসায়ন") ||
          lowBn.includes("রসায়ন") ||
          lowBn.includes("জীব") ||
          lowBn.includes("বিজ্ঞান") ||
          lowBn.includes("আইসিটি")
        ) {
          category = "science";
        } else if (
          low.includes("acc") ||
          low.includes("fin") ||
          low.includes("bus") ||
          low.includes("bank") ||
          lowBn.includes("হিসাব") ||
          lowBn.includes("ফিন্যান্স") ||
          lowBn.includes("উদ্যোগ") ||
          lowBn.includes("ব্যবসায়")
        ) {
          category = "business";
        } else if (
          low.includes("hist") ||
          low.includes("geo") ||
          low.includes("civ") ||
          low.includes("econ") ||
          low.includes("soc") ||
          low.includes("bgs") ||
          lowBn.includes("ইতিহাস") ||
          lowBn.includes("ভূগোল") ||
          lowBn.includes("পৌরনীতি") ||
          lowBn.includes("অর্থনীতি") ||
          lowBn.includes("সমাজ") ||
          lowBn.includes("বিশ্বপরিচয়")
        ) {
          category = "humanities";
        } else if (
          low.includes("rel") ||
          low.includes("islam") ||
          low.includes("hindu") ||
          low.includes("buddh") ||
          low.includes("christ") ||
          low.includes("qur") ||
          low.includes("had") ||
          low.includes("fiq") ||
          lowBn.includes("ধর্ম") ||
          lowBn.includes("ইসলাম") ||
          lowBn.includes("হিন্দু") ||
          lowBn.includes("বৌদ্ধ") ||
          lowBn.includes("খ্রিস্ট") ||
          lowBn.includes("কুরআন")
        ) {
          category = "religion";
        }

        const displayName = nameBn && nameBn !== name ? `${nameBn} (${name})` : name;

        map.set(key, {
          _id: sub._id,
          name,
          nameBn,
          group: sub.group || "Common",
          category,
          displayName,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName, "bn"));
  }, [rawSubjects]);

  function onPhoto(file: File | undefined) {
    if (!file) return;
    if (file.size > PHOTO_MAX_BYTES) {
      toast.error(t.students.photoTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  function salaryPayload() {
    return {
      name: form.name,
      phone: form.phone,
      email: form.email,
      photoUrl: form.photoUrl,
      designation: form.designation,
      joiningDate: form.joiningDate || undefined,
      retirementDate: form.retirementDate || undefined,
      subjects: form.subjects,
      salaryStructure: {
        basic: Number(form.basic) || 0,
        house: 0,
        medical: Number(form.medical) || 0,
        other: Number(form.other) || 0,
      },
    };
  }

  return (
    <div>
      <PageHeader
        title={t.teachers.title}
        subtitle={t.teachers.subtitle}
        action={
          <Button
            onClick={() => {
              setForm(emptyForm);
              setCreateOpen(true);
            }}
          >
            {t.teachers.add}
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.teachers.title} value={rows.length} icon={<GraduationCap size={18} />} />
        <StatCard label={t.common.active} value={active} tone="success" />
        <StatCard label={t.teachers.basic} value={payroll} icon={<Wallet size={18} />} />
      </div>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.teachers.empty} hint={t.teachers.emptyHint} /> : null}
      <DataTable
        searchable
        pageSize={12}
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          {
            header: t.teachers.photo,
            cell: (row) => (
              <div className="flex items-center justify-center">
                <div
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-primary/10 text-xs font-semibold text-primary shadow-xs"
                  title={row.name}
                >
                  {row.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.photoUrl} alt={row.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{row.name.trim().slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
              </div>
            ),
            align: "center",
            className: "w-16",
          },
          { header: t.teachers.staffId, cell: (row) => row.staffId, sortValue: (row) => row.staffId },
          { header: t.common.name, cell: (row) => row.name, sortValue: (row) => row.name },
          { header: t.teachers.designation, cell: (row) => row.designation || "—" },
          {
            header: t.teachers.subjects,
            cell: (row) => {
              const names = Array.from(
                new Set(
                  (row.subjects ?? [])
                    .map((s) => (locale === "bn" ? s.nameBn || s.name : s.name || s.nameBn))
                    .filter(Boolean)
                )
              );
              return names.length ? (
                <div className="flex flex-wrap gap-1">
                  {names.map((n) => (
                    <span key={n} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {n}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              );
            },
          },
          { header: t.common.phone, cell: (row) => row.phone || "—" },
          {
            header: t.teachers.basic,
            cell: (row) => (row.salaryStructure?.basic ? `৳ ${row.salaryStructure.basic.toLocaleString()}` : "—"),
            align: "right",
            sortValue: (row) => row.salaryStructure?.basic ?? 0,
          },
          {
            header: t.common.status,
            cell: (row) => (
              <StatusBadge
                label={row.isActive === false ? t.common.inactive : t.common.active}
                tone={activeTone(row.isActive)}
              />
            ),
          },
        ]}
        actions={(row) => [
          {
            label: t.common.edit,
            onClick: () => {
              setEdit(row);
              setForm({
                name: row.name,
                phone: row.phone ?? "",
                email: row.email ?? "",
                photoUrl: row.photoUrl ?? "",
                designation: row.designation ?? "Teacher",
                joiningDate: row.joiningDate ? new Date(row.joiningDate).toISOString().slice(0, 10) : "",
                retirementDate: row.retirementDate ? new Date(row.retirementDate).toISOString().slice(0, 10) : "",
                basic: row.salaryStructure?.basic ?? "",
                medical: row.salaryStructure?.medical ?? "",
                other: row.salaryStructure?.other ?? "",
                subjects: (row.subjects ?? []).map((s) => s._id).filter(Boolean) as string[],
              });
            },
          },
          {
            label: row.isActive === false ? t.common.activate : t.common.deactivate,
            onClick: () => setConfirm(row),
          },
        ]}
        mobileCard={(row) => (
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-sm font-semibold text-primary shadow-xs">
              {row.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.photoUrl} alt={row.name} className="h-full w-full object-cover" />
              ) : (
                <span>{row.name.trim().slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium text-foreground">{row.name}</p>
                <StatusBadge
                  label={row.isActive === false ? t.common.inactive : t.common.active}
                  tone={activeTone(row.isActive)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {row.staffId} · {row.designation || "Teacher"}
              </p>
              {row.subjects?.length ? (
                <p className="truncate text-xs font-medium text-primary">
                  {Array.from(
                    new Set(
                      row.subjects
                        .map((s) => (locale === "bn" ? s.nameBn || s.name : s.name))
                        .filter(Boolean)
                    )
                  ).join(", ")}
                </p>
              ) : null}
              {row.salaryStructure?.basic ? (
                <p className="text-xs text-muted-foreground">
                  {t.teachers.basic}: ৳ {row.salaryStructure.basic.toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
        )}
      />
      <Dialog open={createOpen} title={t.teachers.add} onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await createTeacher(salaryPayload());
            if (toastApiResult(result, t.common.add, t.common.loadError)) {
              setCreateOpen(false);
              setForm(emptyForm);
            }
          }}
        >
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-3 md:col-span-2">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-base font-semibold text-primary shadow-xs">
              {form.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{form.name.slice(0, 1) || "T"}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label className="text-xs font-medium text-foreground">{t.teachers.photo}</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1 block w-full text-xs text-muted-foreground file:mr-2 file:rounded-md file:border file:border-border file:bg-background file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted"
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{t.students.photoHint}</p>
            </div>
            {form.photoUrl ? (
              <Button
                type="button"
                variant="secondary"
                className="h-8 px-2 text-xs"
                onClick={() => setForm((prev) => ({ ...prev, photoUrl: "" }))}
              >
                {t.common.delete}
              </Button>
            ) : null}
          </div>
          <Field label={t.common.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label={t.common.phone}>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label={t.common.email}>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label={t.teachers.designation}>
            <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </Field>
          <Field label={t.teachers.basic}>
            <Input
              type="number"
              value={form.basic}
              onChange={(e) => setForm({ ...form, basic: e.target.value === "" ? "" : Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label={t.teachers.medical}>
            <Input
              type="number"
              value={form.medical}
              onChange={(e) => setForm({ ...form, medical: e.target.value === "" ? "" : Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label={t.teachers.joiningDate}>
            <Input
              type="date"
              value={form.joiningDate}
              onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
            />
          </Field>
          <Field label={t.teachers.retirementDate}>
            <Input
              type="date"
              value={form.retirementDate}
              onChange={(e) => setForm({ ...form, retirementDate: e.target.value })}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label={t.teachers.subjects}>
              <SubjectPicker
                available={availableSubjects}
                selectedIds={form.subjects}
                onChange={(subjects) => setForm((prev) => ({ ...prev, subjects }))}
                locale={locale}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit">{t.common.add}</Button>
          </div>
        </form>
      </Dialog>
      <Sheet open={Boolean(edit)} title={t.common.edit} onClose={() => setEdit(null)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!edit) return;
            const result = await updateTeacher({ id: edit._id, ...salaryPayload() });
            if (toastApiResult(result, t.common.save, t.common.loadError)) setEdit(null);
          }}
        >
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-base font-semibold text-primary shadow-xs">
              {form.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{form.name.slice(0, 1) || "T"}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label className="text-xs font-medium text-foreground">{t.teachers.photo}</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1 block w-full text-xs text-muted-foreground file:mr-2 file:rounded-md file:border file:border-border file:bg-background file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted"
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{t.students.photoHint}</p>
            </div>
            {form.photoUrl ? (
              <Button
                type="button"
                variant="secondary"
                className="h-8 px-2 text-xs"
                onClick={() => setForm((prev) => ({ ...prev, photoUrl: "" }))}
              >
                {t.common.delete}
              </Button>
            ) : null}
          </div>
          <Field label={t.common.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label={t.common.phone}>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label={t.teachers.designation}>
            <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </Field>
          <Field label={t.teachers.basic}>
            <Input
              type="number"
              value={form.basic}
              onChange={(e) => setForm({ ...form, basic: e.target.value === "" ? "" : Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label={t.teachers.medical}>
            <Input
              type="number"
              value={form.medical}
              onChange={(e) => setForm({ ...form, medical: e.target.value === "" ? "" : Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label={t.teachers.other}>
            <Input
              type="number"
              value={form.other}
              onChange={(e) => setForm({ ...form, other: e.target.value === "" ? "" : Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label={t.teachers.joiningDate}>
            <Input
              type="date"
              value={form.joiningDate}
              onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
            />
          </Field>
          <Field label={t.teachers.retirementDate}>
            <Input
              type="date"
              value={form.retirementDate}
              onChange={(e) => setForm({ ...form, retirementDate: e.target.value })}
            />
          </Field>
          <Field label={t.teachers.subjects}>
            <SubjectPicker
              available={availableSubjects}
              selectedIds={form.subjects}
              onChange={(subjects) => setForm((prev) => ({ ...prev, subjects }))}
              locale={locale}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEdit(null)}>
              {t.common.cancel}
            </Button>
            <Button disabled={saving} type="submit">
              {t.common.save}
            </Button>
          </div>
        </form>
      </Sheet>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={t.teachers.deactivateAsk}
        message={confirm?.name ?? ""}
        confirmLabel={confirm?.isActive === false ? t.common.activate : t.common.deactivate}
        danger={confirm?.isActive !== false}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const result = await updateTeacher({ id: confirm._id, isActive: confirm.isActive === false });
          if (toastApiResult(result, t.common.save, t.common.loadError)) setConfirm(null);
        }}
      />
    </div>
  );
}
