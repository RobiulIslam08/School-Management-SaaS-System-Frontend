"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Dialog } from "@/components/dialog";
import { EmptyState, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import {
  useCreateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useGetCalendarEventsQuery,
  useUpdateCalendarEventMutation,
} from "@/lib/api/schoolApi";
import { toastApiResult } from "@/lib/toast-api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  holiday: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "ছুটি (Holiday)" },
  exam: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "পরীক্ষা (Exam)" },
  event: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "অনুষ্ঠান (Event)" },
  meeting: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "মিটিং (Meeting)" },
  other: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", label: "অন্যান্য (Other)" },
};

export default function CalendarPage() {
  const { t } = useI18n();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<"holiday" | "exam" | "event" | "meeting" | "other">("event");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const { data, isLoading } = useGetCalendarEventsQuery({
    year: String(currentYear),
    month: String(currentMonth + 1),
  });

  const [createEvent, { isLoading: isCreating }] = useCreateCalendarEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateCalendarEventMutation();
  const [deleteEvent] = useDeleteCalendarEventMutation();

  const events = (data?.data ?? []) as Array<{
    _id: string;
    title: string;
    titleBn?: string;
    date: string;
    endDate?: string;
    type: "holiday" | "exam" | "event" | "meeting" | "other";
    description?: string;
    isPublic: boolean;
  }>;

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    // Empty padding slots
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateStr: null, isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        day: d,
        dateStr: `${currentYear}-${mStr}-${dStr}`,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const ev of events) {
      const dStr = new Date(ev.date).toISOString().slice(0, 10);
      if (!map.has(dStr)) map.set(dStr, []);
      map.get(dStr)!.push(ev);
    }
    return map;
  }, [events]);

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleOpenCreate(defaultDate?: string) {
    setEditingId(null);
    setTitle("");
    setTitleBn("");
    setDate(defaultDate || `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`);
    setEndDate("");
    setType("event");
    setDescription("");
    setIsPublic(true);
    setDialogOpen(true);
  }

  function handleOpenEdit(ev: (typeof events)[number]) {
    setEditingId(ev._id);
    setTitle(ev.title);
    setTitleBn(ev.titleBn || "");
    setDate(new Date(ev.date).toISOString().slice(0, 10));
    setEndDate(ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 10) : "");
    setType(ev.type);
    setDescription(ev.description || "");
    setIsPublic(ev.isPublic !== false);
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("Title and Date are required");
      return;
    }

    const payload = {
      title: title.trim(),
      titleBn: titleBn.trim(),
      date,
      endDate: endDate || undefined,
      type,
      description: description.trim(),
      isPublic,
      academicYear: String(currentYear),
    };

    if (editingId) {
      const res = await updateEvent({ id: editingId, ...payload });
      toastApiResult(res, "Event updated successfully");
    } else {
      const res = await createEvent(payload);
      toastApiResult(res, "Event added successfully");
    }
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const res = await deleteEvent(id);
    toastApiResult(res, "Event deleted");
  }

  return (
    <div className="calendar-page space-y-6">
      <div className="no-print">
        <PageHeader
          title="Academic Calendar (একাডেমিক ক্যালেন্ডার)"
          subtitle="Annual events, holidays, examination dates, and meeting schedules"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                {t.common.print}
              </Button>
              <Button onClick={() => handleOpenCreate()}>+ Add Event (ইভেন্ট যোগ করুন)</Button>
            </div>
          }
        />

        {/* Month selector & legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-white p-4">
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="h-8 px-2 text-xs" onClick={handlePrevMonth}>
              ‹ Prev
            </Button>
            <span className="text-lg font-bold min-w-[160px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <Button variant="secondary" className="h-8 px-2 text-xs" onClick={handleNextMonth}>
              Next ›
            </Button>
            <Button
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => {
                setCurrentYear(today.getFullYear());
                setCurrentMonth(today.getMonth());
              }}
            >
              Today
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {Object.entries(EVENT_TYPE_COLORS).map(([k, c]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("inline-block h-3 w-3 rounded-full border", c.bg, c.border)} />
                <span className="font-medium">{c.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="rounded-lg border border-border bg-white p-4 print:p-0 print:border-none">
          {/* Print Title Header */}
          <div className="hidden print:block mb-4 text-center">
            <h2 className="text-xl font-bold">Academic Calendar — {MONTH_NAMES[currentMonth]} {currentYear}</h2>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px border border-border bg-muted/30 text-center font-semibold text-xs py-2 uppercase tracking-wider">
            <div className="text-rose-600">Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div className="text-rose-600">Fri</div>
            <div className="text-rose-600">Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px border-x border-b border-border bg-border">
            {calendarDays.map((cell, idx) => {
              if (!cell.day) {
                return <div key={idx} className="min-h-[110px] bg-muted/10 p-1.5" />;
              }

              const dayEvents = cell.dateStr ? eventsByDate.get(cell.dateStr) ?? [] : [];
              const isToday =
                cell.day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[110px] bg-white p-1.5 flex flex-col justify-between transition-colors hover:bg-muted/10",
                    isToday && "bg-blue-50/40"
                  )}
                  onClick={() => cell.dateStr && handleOpenCreate(cell.dateStr)}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday ? "bg-primary text-white" : "text-muted-foreground"
                      )}
                    >
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                    {dayEvents.map((ev) => {
                      const style = EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS.other;
                      return (
                        <div
                          key={ev._id}
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[11px] leading-tight font-medium cursor-pointer truncate",
                            style.bg,
                            style.text,
                            style.border
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(ev);
                          }}
                          title={`${ev.title}${ev.description ? ` - ${ev.description}` : ""}`}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events List for Month */}
      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="text-base font-semibold mb-3">All Events in {MONTH_NAMES[currentMonth]} {currentYear}</h3>
        {!events.length ? (
          <EmptyState title="No events scheduled this month" hint="Click on any date above to add an event." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-left text-sm">
              <thead>
                <tr className="bg-muted/40 text-xs font-semibold uppercase">
                  <th className="border border-border p-2">Date</th>
                  <th className="border border-border p-2">Type</th>
                  <th className="border border-border p-2">Title</th>
                  <th className="border border-border p-2">Description</th>
                  <th className="border border-border p-2 text-center">Public</th>
                  <th className="border border-border p-2 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const style = EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS.other;
                  return (
                    <tr key={ev._id} className="hover:bg-muted/20">
                      <td className="border border-border p-2 font-mono text-xs whitespace-nowrap">
                        {new Date(ev.date).toLocaleDateString()}
                        {ev.endDate ? ` - ${new Date(ev.endDate).toLocaleDateString()}` : ""}
                      </td>
                      <td className="border border-border p-2">
                        <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-medium border", style.bg, style.text, style.border)}>
                          {style.label}
                        </span>
                      </td>
                      <td className="border border-border p-2 font-medium">
                        {ev.title}
                        {ev.titleBn ? <span className="block text-xs text-muted-foreground">{ev.titleBn}</span> : null}
                      </td>
                      <td className="border border-border p-2 text-xs text-muted-foreground">{ev.description || "—"}</td>
                      <td className="border border-border p-2 text-center">
                        {ev.isPublic ? (
                          <span className="text-emerald-600 font-bold text-xs">Yes</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Internal</span>
                        )}
                      </td>
                      <td className="border border-border p-2 text-right no-print">
                        <div className="flex justify-end gap-1">
                          <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => handleOpenEdit(ev)}>
                            Edit
                          </Button>
                          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => handleDelete(ev._id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Event Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Edit Event (ইভেন্ট সম্পাদনা)" : "Add Calendar Event (ইভেন্ট যোগ করুন)"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Title (English) *">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Eid-ul-Fitr Holiday" required />
          </Field>
          <Field label="Title (বাংলা)">
            <Input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} placeholder="যেমন: ঈদুল ফিতরের ছুটি" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date *">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="End Date (Optional)">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Event Type">
              <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="holiday">Holiday (ছুটি)</option>
                <option value="exam">Exam (পরীক্ষা)</option>
                <option value="event">Event (অনুষ্ঠান)</option>
                <option value="meeting">Meeting (মিটিং)</option>
                <option value="other">Other (অন্যান্য)</option>
              </Select>
            </Field>
            <Field label="Public on Website?">
              <Select value={isPublic ? "yes" : "no"} onChange={(e) => setIsPublic(e.target.value === "yes")}>
                <option value="yes">Yes (Visible to public)</option>
                <option value="no">No (Internal only)</option>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes or details regarding this event"
              rows={3}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? "Saving..." : "Save Event"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
