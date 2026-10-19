"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Dialog } from "@/components/dialog";
import { EmptyState, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import {
  useCreateLectureMaterialMutation,
  useDeleteLectureMaterialMutation,
  useGetClassesQuery,
  useGetLectureMaterialsQuery,
  useGetSubjectsQuery,
  useMeQuery,
} from "@/lib/api/schoolApi";
import { toastApiResult } from "@/lib/toast-api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FILE_TYPE_ICONS: Record<string, { icon: string; bg: string; text: string }> = {
  pdf: { icon: "📄 PDF", bg: "bg-rose-50", text: "text-rose-700" },
  excel: { icon: "📊 Excel", bg: "bg-emerald-50", text: "text-emerald-700" },
  word: { icon: "📝 Word", bg: "bg-blue-50", text: "text-blue-700" },
  image: { icon: "🖼️ Image", bg: "bg-purple-50", text: "text-purple-700" },
  video: { icon: "🎥 Video", bg: "bg-amber-50", text: "text-amber-700" },
  other: { icon: "📁 File", bg: "bg-gray-50", text: "text-gray-700" },
};

export default function MaterialsPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"pdf" | "excel" | "word" | "image" | "video" | "other">("pdf");
  const [isVisible, setIsVisible] = useState(true);

  const { data: classesData } = useGetClassesQuery();
  const { data: subjectsData } = useGetSubjectsQuery(classId || undefined);
  const { data: formSubjectsData } = useGetSubjectsQuery(formClassId || undefined);

  const { data, isLoading } = useGetLectureMaterialsQuery({
    classId: classId || undefined,
    subjectId: subjectId || undefined,
  });

  const [createMaterial, { isLoading: isCreating }] = useCreateLectureMaterialMutation();
  const [deleteMaterial] = useDeleteLectureMaterialMutation();

  const materials = (data?.data ?? []) as Array<{
    _id: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileType: "pdf" | "excel" | "word" | "image" | "video" | "other";
    isVisible: boolean;
    classId?: { _id: string; name: string };
    subjectId?: { _id: string; name: string; code: string };
    teacherName?: string;
    createdAt: string;
  }>;

  const classes = (classesData?.data ?? []) as Array<{ _id: string; name: string }>;
  const subjects = (subjectsData?.data ?? []) as Array<{ _id: string; name: string }>;
  const formSubjects = (formSubjectsData?.data ?? []) as Array<{ _id: string; name: string }>;

  function openCreate() {
    setTitle("");
    setDescription("");
    setFormClassId(classId || (classes[0]?._id ?? ""));
    setFormSubjectId(subjectId || "");
    setFileUrl("");
    setFileName("");
    setFileType("pdf");
    setIsVisible(true);
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) {
      toast.error("Title and File Link/URL are required");
      return;
    }

    const res = await createMaterial({
      title: title.trim(),
      description: description.trim(),
      classId: formClassId || undefined,
      subjectId: formSubjectId || undefined,
      fileUrl: fileUrl.trim(),
      fileName: fileName.trim() || title.trim(),
      fileType,
      isVisible,
      teacherName: session?.data.user.name || "Teacher",
    });

    toastApiResult(res, "Lecture sheet / material uploaded successfully");
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this material?")) return;
    const res = await deleteMaterial(id);
    toastApiResult(res, "Material deleted");
  }

  return (
    <div className="materials-page space-y-6">
      <div className="no-print">
        <PageHeader
          title="Lecture Sheets & Study Materials (শিক্ষক ম্যাটেরিয়াল)"
          subtitle="Upload Word, Excel, PDF, Images and video links for students and class subjects"
          action={
            <Button onClick={openCreate}>+ Upload Material (ম্যাটেরিয়াল আপলোড)</Button>
          }
        />

        {/* Filter bar */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 rounded-lg border border-border bg-white p-4">
          <Field label="Filter by Class">
            <Select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSubjectId("");
              }}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Filter by Subject">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !materials.length ? (
        <EmptyState
          title="No study materials uploaded yet"
          hint="Click '+ Upload Material' above to attach lecture sheets or notes for students."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((item) => {
            const typeStyle = FILE_TYPE_ICONS[item.fileType] || FILE_TYPE_ICONS.other;
            return (
              <div
                key={item._id}
                className="flex flex-col justify-between rounded-lg border border-border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-block rounded px-2 py-0.5 text-xs font-bold",
                        typeStyle.bg,
                        typeStyle.text
                      )}
                    >
                      {typeStyle.icon}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-foreground line-clamp-1">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    {item.classId?.name && (
                      <span className="rounded bg-muted px-2 py-0.5 font-medium">Class: {item.classId.name}</span>
                    )}
                    {item.subjectId?.name && (
                      <span className="rounded bg-muted px-2 py-0.5 font-medium">Subject: {item.subjectId.name}</span>
                    )}
                  </div>
                  {item.teacherName && (
                    <div className="mt-2 text-[11px] text-muted-foreground">Uploaded by: {item.teacherName}</div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    View / Download
                  </a>
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-xs text-rose-600"
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Material Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Upload Study Material / Lecture Sheet"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Material Title *">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 Physics Lecture Notes"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target Class">
              <Select value={formClassId} onChange={(e) => setFormClassId(e.target.value)}>
                <option value="">General (All classes)</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subject">
              <Select value={formSubjectId} onChange={(e) => setFormSubjectId(e.target.value)}>
                <option value="">General (All subjects)</option>
                {formSubjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="File Type">
              <Select value={fileType} onChange={(e) => setFileType(e.target.value as typeof fileType)}>
                <option value="pdf">PDF Document</option>
                <option value="excel">Excel Sheet (.xlsx / .csv)</option>
                <option value="word">Word Document (.docx)</option>
                <option value="image">Image / Graphic (.png / .jpg)</option>
                <option value="video">Video Lecture (YouTube / Vimeo)</option>
                <option value="other">Other File</option>
              </Select>
            </Field>
            <Field label="File Name">
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. lecture_04.pdf"
              />
            </Field>
          </div>
          <Field label="Direct File URL or Cloud Link (Google Drive / S3 / YouTube) *">
            <Input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/... or https://..."
              required
            />
          </Field>
          <Field label="Description / Topics Covered">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of topics covered in this sheet"
              rows={2}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Uploading..." : "Save & Share"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
