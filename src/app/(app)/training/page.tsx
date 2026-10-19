"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Dialog } from "@/components/dialog";
import { EmptyState, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import {
  useCreateTrainingMutation,
  useDeleteTrainingMutation,
  useGetTeachersQuery,
  useGetTrainingsQuery,
  useMeQuery,
  useUpdateTrainingAttendanceMutation,
  useUpdateTrainingMutation,
} from "@/lib/api/schoolApi";
import { toastApiResult } from "@/lib/toast-api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function TrainingPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Manage participants modal
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [activeTraining, setActiveTraining] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trainer, setTrainer] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"upcoming" | "ongoing" | "completed">("upcoming");

  const { data, isLoading } = useGetTrainingsQuery(statusFilter ? { status: statusFilter } : undefined);
  const { data: teachersData } = useGetTeachersQuery();

  const [createTraining, { isLoading: isCreating }] = useCreateTrainingMutation();
  const [updateTraining, { isLoading: isUpdating }] = useUpdateTrainingMutation();
  const [deleteTraining] = useDeleteTrainingMutation();
  const [updateAttendance, { isLoading: isUpdatingAtt }] = useUpdateTrainingAttendanceMutation();

  const trainings = (data?.data ?? []) as any[];
  const teachers = (teachersData?.data ?? []) as Array<{ _id: string; name: string }>;

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setTrainer("");
    setVenue("");
    setStartDate("");
    setEndDate("");
    setStatus("upcoming");
    setDialogOpen(true);
  }

  function openEdit(item: any) {
    setEditingId(item._id);
    setTitle(item.title);
    setDescription(item.description || "");
    setTrainer(item.trainer || "");
    setVenue(item.venue || "");
    setStartDate(item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : "");
    setEndDate(item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : "");
    setStatus(item.status || "upcoming");
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Training title is required");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      trainer: trainer.trim(),
      venue: venue.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status,
    };

    if (editingId) {
      const res = await updateTraining({ id: editingId, ...payload });
      toastApiResult(res, "Training session updated");
    } else {
      const res = await createTraining(payload);
      toastApiResult(res, "Training session created");
    }
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this training session?")) return;
    const res = await deleteTraining(id);
    toastApiResult(res, "Training deleted");
  }

  function openManageParticipants(item: any) {
    setActiveTraining(item);
    setParticipantsModalOpen(true);
  }

  async function toggleAttended(index: number) {
    if (!activeTraining) return;
    const copy = [...activeTraining.participants];
    copy[index] = { ...copy[index], attended: !copy[index].attended };
    const updated = { ...activeTraining, participants: copy };
    setActiveTraining(updated);
    await updateAttendance({ id: activeTraining._id, participants: copy });
  }

  async function toggleCertificate(index: number) {
    if (!activeTraining) return;
    const copy = [...activeTraining.participants];
    copy[index] = { ...copy[index], certificateIssued: !copy[index].certificateIssued };
    const updated = { ...activeTraining, participants: copy };
    setActiveTraining(updated);
    await updateAttendance({ id: activeTraining._id, participants: copy });
  }

  async function addTeacherToTraining(teacherId: string) {
    if (!activeTraining) return;
    const teacher = teachers.find((t) => t._id === teacherId);
    if (!teacher) return;
    if (activeTraining.participants?.some((p: any) => p.staffId === teacherId)) {
      toast.error("Teacher already added to this training");
      return;
    }
    const copy = [
      ...(activeTraining.participants || []),
      { staffId: teacher._id, staffName: teacher.name, attended: false, certificateIssued: false },
    ];
    const updated = { ...activeTraining, participants: copy };
    setActiveTraining(updated);
    const res = await updateAttendance({ id: activeTraining._id, participants: copy });
    toastApiResult(res, `Added ${teacher.name}`);
  }

  return (
    <div className="training-page space-y-6">
      <div className="no-print">
        <PageHeader
          title="Teacher & Staff Training (প্রশিক্ষণ ব্যবস্থাপনা)"
          subtitle="Manage professional development programs, attendance registers, and certification for teachers"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                {t.common.print}
              </Button>
              <Button onClick={openCreate}>+ New Training Program (নতুন প্রশিক্ষণ)</Button>
            </div>
          }
        />

        <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Filter Status:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { val: "", label: "All Sessions" },
              { val: "upcoming", label: "Upcoming (আসন্ন)" },
              { val: "ongoing", label: "Ongoing (চলমান)" },
              { val: "completed", label: "Completed (সম্পন্ন)" },
            ].map((st) => (
              <Button
                key={st.val}
                variant={statusFilter === st.val ? "primary" : "secondary"}
                className="h-8 px-3 text-xs"
                onClick={() => setStatusFilter(st.val)}
              >
                {st.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !trainings.length ? (
        <EmptyState
          title="No training programs found"
          hint="Click '+ New Training Program' above to record a workshop or professional development session."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainings.map((tr) => (
            <div
              key={tr._id}
              className="flex flex-col justify-between rounded-lg border border-border bg-white p-5 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                      tr.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : tr.status === "ongoing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {tr.status.toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {tr.participants?.length ?? 0} Staff Enrolled
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-foreground">{tr.title}</h3>
                {tr.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{tr.description}</p>
                )}

                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {tr.trainer && <div>Trainer: <strong className="text-foreground">{tr.trainer}</strong></div>}
                  {tr.venue && <div>Venue: <strong className="text-foreground">{tr.venue}</strong></div>}
                  {tr.startDate && (
                    <div className="font-mono">
                      Dates: {new Date(tr.startDate).toLocaleDateString()}
                      {tr.endDate ? ` - ${new Date(tr.endDate).toLocaleDateString()}` : ""}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t pt-3 flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => openManageParticipants(tr)}
                >
                  👥 Attendance & Register
                </Button>
                <div className="flex gap-1">
                  <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => openEdit(tr)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-xs text-rose-600"
                    onClick={() => handleDelete(tr._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Edit Training Program" : "New Staff Training Program"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Program Title *">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Modern Teaching Pedagogy & Technology Workshop"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Trainer / Resource Person">
              <Input
                value={trainer}
                onChange={(e) => setTrainer(e.target.value)}
                placeholder="e.g. Dr. Rafiqul Islam / Govt TTC"
              />
            </Field>
            <Field label="Venue / Location">
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Teachers Lounge / Zoom" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End Date">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Program Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="upcoming">Upcoming (আসন্ন)</option>
              <option value="ongoing">Ongoing (চলমান)</option>
              <option value="completed">Completed (সম্পন্ন)</option>
            </Select>
          </Field>
          <Field label="Description / Objectives">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Course outline and learning outcomes"
              rows={3}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? "Saving..." : "Save Program"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Participants & Attendance Dialog */}
      <Dialog
        open={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        title={`Attendance & Certification — ${activeTraining?.title || ""}`}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Add staff dropdown */}
          <div className="no-print flex items-end gap-2 rounded bg-muted/30 p-3">
            <div className="flex-1">
              <Field label="Enroll Teacher / Staff Member">
                <Select id="select-teacher-enroll" defaultValue="">
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map((tc) => (
                    <option key={tc._id} value={tc._id}>
                      {tc.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button
              type="button"
              className="h-10 px-3 text-xs"
              onClick={() => {
                const el = document.getElementById("select-teacher-enroll") as HTMLSelectElement;
                if (el?.value) {
                  addTeacherToTraining(el.value);
                  el.value = "";
                }
              }}
            >
              + Enroll
            </Button>
          </div>

          {/* Roster table */}
          {!activeTraining?.participants?.length ? (
            <p className="text-center py-4 text-xs text-muted-foreground">
              No staff enrolled yet. Select a teacher above to add them.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 uppercase font-semibold">
                    <th className="border border-border p-2 text-center w-8">#</th>
                    <th className="border border-border p-2">Staff Member Name</th>
                    <th className="border border-border p-2 text-center">Attended?</th>
                    <th className="border border-border p-2 text-center">Certificate Issued?</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTraining.participants.map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="border border-border p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-border p-2 font-medium">{p.staffName || "Staff"}</td>
                      <td className="border border-border p-2 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(p.attended)}
                          onChange={() => toggleAttended(idx)}
                          className="h-4 w-4 cursor-pointer rounded border-border text-primary"
                        />
                      </td>
                      <td className="border border-border p-2 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(p.certificateIssued)}
                          onChange={() => toggleCertificate(idx)}
                          className="h-4 w-4 cursor-pointer rounded border-border text-primary"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={() => setParticipantsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
