"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Dialog } from "@/components/dialog";
import { EmptyState, TableSkeleton } from "@/components/query-state";
import { Button, Field, Input, Select } from "@/components/ui";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  useDeleteTimeAttendanceMappingMutation,
  useGetTeachersQuery,
  useGetTimeAttendanceLogsQuery,
  useGetTimeAttendanceMappingsQuery,
  useUpsertTimeAttendanceMappingMutation,
} from "@/lib/api/schoolApi";
import { toastApiResult } from "@/lib/toast-api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function TimeAttendancePage() {
  const { t } = useI18n();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<"logs" | "mappings" | "setup">("logs");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [deviceIdFilter, setDeviceIdFilter] = useState("");

  // Mapping Dialog state
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [deviceId, setDeviceId] = useState("DEV-01");
  const [deviceUserId, setDeviceUserId] = useState("");
  const [staffId, setStaffId] = useState("");

  const { data: logsData, isLoading: logsLoading } = useGetTimeAttendanceLogsQuery({
    date: selectedDate || undefined,
    deviceId: deviceIdFilter || undefined,
  });

  const { data: mappingsData, isLoading: mappingsLoading } = useGetTimeAttendanceMappingsQuery();
  const { data: teachersData } = useGetTeachersQuery();

  const [upsertMapping, { isLoading: isSavingMapping }] = useUpsertTimeAttendanceMappingMutation();
  const [deleteMapping] = useDeleteTimeAttendanceMappingMutation();

  const logs = (logsData?.data ?? []) as Array<{
    _id: string;
    deviceId: string;
    deviceUserId: string;
    punchTime: string;
    punchType: "in" | "out" | "unknown";
    staffName?: string;
  }>;

  const mappings = (mappingsData?.data ?? []) as Array<{
    _id: string;
    deviceId: string;
    deviceUserId: string;
    staffId: string;
    staffName: string;
  }>;

  const teachers = (teachersData?.data ?? []) as Array<{ _id: string; name: string }>;

  function openCreateMapping() {
    setDeviceId("DEV-01");
    setDeviceUserId("");
    setStaffId(teachers[0]?._id ?? "");
    setMappingDialogOpen(true);
  }

  async function handleSaveMapping(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceId.trim() || !deviceUserId.trim() || !staffId) {
      toast.error("All fields are required");
      return;
    }

    const teacher = teachers.find((t) => t._id === staffId);
    const res = await upsertMapping({
      deviceId: deviceId.trim(),
      deviceUserId: deviceUserId.trim(),
      staffId,
      staffName: teacher?.name ?? "Staff",
    });

    toastApiResult(res, "Device user mapping saved");
    setMappingDialogOpen(false);
  }

  async function handleDeleteMapping(id: string) {
    if (!confirm("Are you sure you want to remove this mapping?")) return;
    const res = await deleteMapping(id);
    toastApiResult(res, "Mapping removed");
  }

  return (
    <div className="time-attendance-page space-y-6">
      <div className="no-print">
        <PageHeader
          title="Time Attendance Machine Integration (বায়োমেট্রিক ও আরএফআইডি)"
          subtitle="Real-time punch sync from biometric fingerprint, face-recognition, and RFID attendance hardware"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                {t.common.print}
              </Button>
              <Button onClick={openCreateMapping}>+ Map Device User (ডিভাইস ইউজার ম্যাপিং)</Button>
            </div>
          }
        />

        <WorkspaceTabs
          tabs={[
            { id: "logs", label: "Live Punch Logs (হাজিরা লগ)" },
            { id: "mappings", label: "Device User Mappings (ইউজার ম্যাপিং)" },
            { id: "setup", label: "Machine Connection Setup (মেশিন সেটআপ)" },
          ]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as typeof activeTab)}
        />
      </div>

      {/* TAB 1: PUNCH LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white p-4">
            <Field label="Filter by Date">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </Field>
            <Field label="Filter by Device ID">
              <Input
                value={deviceIdFilter}
                onChange={(e) => setDeviceIdFilter(e.target.value)}
                placeholder="e.g. DEV-01"
                className="w-48"
              />
            </Field>
            <div className="pt-5">
              <Button variant="ghost" onClick={() => { setSelectedDate(""); setDeviceIdFilter(""); }}>
                Reset Filters
              </Button>
            </div>
          </div>

          {logsLoading ? (
            <TableSkeleton />
          ) : !logs.length ? (
            <EmptyState
              title="No punch logs recorded for this date"
              hint="Punches will appear automatically when device syncs or webhook pushes data."
            />
          ) : (
            <div className="rounded-lg border border-border bg-white p-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border text-left text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-xs font-semibold uppercase">
                      <th className="border border-border p-2 text-center w-12">#</th>
                      <th className="border border-border p-2">Device ID</th>
                      <th className="border border-border p-2 font-mono">User ID on Device</th>
                      <th className="border border-border p-2">Mapped Staff Name</th>
                      <th className="border border-border p-2 text-center">Punch Time</th>
                      <th className="border border-border p-2 text-center">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={log._id} className="hover:bg-muted/10">
                        <td className="border border-border p-2 text-center font-mono text-xs">{idx + 1}</td>
                        <td className="border border-border p-2 font-mono text-xs">{log.deviceId}</td>
                        <td className="border border-border p-2 font-mono font-bold text-primary">
                          {log.deviceUserId}
                        </td>
                        <td className="border border-border p-2 font-medium">
                          {log.staffName ? (
                            <span className="font-semibold text-emerald-800">{log.staffName}</span>
                          ) : (
                            <span className="text-xs italic text-amber-700">Unmapped (Click Mapping to assign)</span>
                          )}
                        </td>
                        <td className="border border-border p-2 text-center font-mono text-xs">
                          {new Date(log.punchTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="border border-border p-2 text-center">
                          <span
                            className={cn(
                              "inline-block rounded px-2 py-0.5 text-xs font-bold uppercase",
                              log.punchType === "in"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.punchType === "out"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            )}
                          >
                            {log.punchType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAPPINGS */}
      {activeTab === "mappings" && (
        <div className="space-y-4">
          {mappingsLoading ? (
            <TableSkeleton />
          ) : !mappings.length ? (
            <EmptyState
              title="No device user mappings configured"
              hint="Map each biometric device enrolled user ID (e.g. 101) to a teacher or staff member."
            />
          ) : (
            <div className="rounded-lg border border-border bg-white p-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border text-left text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-xs font-semibold uppercase">
                      <th className="border border-border p-2">Device ID</th>
                      <th className="border border-border p-2 font-mono">User ID on Device</th>
                      <th className="border border-border p-2">School Staff Member</th>
                      <th className="border border-border p-2 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((m) => (
                      <tr key={m._id} className="hover:bg-muted/10">
                        <td className="border border-border p-2 font-mono text-xs">{m.deviceId}</td>
                        <td className="border border-border p-2 font-mono font-bold text-primary">
                          {m.deviceUserId}
                        </td>
                        <td className="border border-border p-2 font-semibold text-foreground">{m.staffName}</td>
                        <td className="border border-border p-2 text-right no-print">
                          <Button
                            variant="ghost"
                            className="h-8 px-2 text-xs text-rose-600"
                            onClick={() => handleDeleteMapping(m._id)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SETUP INSTRUCTIONS */}
      {activeTab === "setup" && (
        <div className="rounded-lg border border-border bg-white p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-primary">Biometric Machine Integration Guide</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Supports ZKTeco (ADMS/Cloud), Virdi, Realtime, eSSL, and all standard HTTP webhook push machines.
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted/20 p-4 space-y-3 text-xs">
            <h4 className="font-bold text-foreground uppercase tracking-wider">REST API Webhook Push URL:</h4>
            <code className="block rounded bg-foreground/5 p-2 font-mono text-primary font-bold">
              POST /api/v1/time-attendance/push
            </code>
            <p className="text-muted-foreground">JSON Payload Structure sent by machine software / bridge:</p>
            <pre className="rounded bg-foreground/95 p-3 text-emerald-400 font-mono text-xs overflow-x-auto">
{`{
  "deviceId": "DEV-01",
  "punches": [
    {
      "deviceUserId": "101",
      "punchTime": "2026-10-19T09:15:30.000Z",
      "punchType": "in"
    }
  ]
}`}
            </pre>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded border border-border p-4 space-y-2">
              <h4 className="font-bold">Step 1: Enroll Fingerprint / Face / RFID</h4>
              <p className="text-muted-foreground">
                Register teacher or staff on the machine hardware. Note down the assigned ID number (e.g. 1, 2, 101).
              </p>
            </div>
            <div className="rounded border border-border p-4 space-y-2">
              <h4 className="font-bold">Step 2: Map to Staff Member</h4>
              <p className="text-muted-foreground">
                In the &quot;Device User Mappings&quot; tab above, click &quot;Map Device User&quot; to link the device ID to the school staff account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mapping Dialog */}
      <Dialog
        open={mappingDialogOpen}
        onClose={() => setMappingDialogOpen(false)}
        title="Map Machine User ID to Staff Member"
      >
        <form onSubmit={handleSaveMapping} className="space-y-4">
          <Field label="Device ID *">
            <Input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g. DEV-01 or MAIN_GATE"
              required
            />
          </Field>
          <Field label="User ID on Device (Enrollment No) *">
            <Input
              value={deviceUserId}
              onChange={(e) => setDeviceUserId(e.target.value)}
              placeholder="e.g. 101"
              required
            />
          </Field>
          <Field label="Select Teacher / Staff Member *">
            <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              {teachers.map((tc) => (
                <option key={tc._id} value={tc._id}>
                  {tc.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setMappingDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingMapping}>
              {isSavingMapping ? "Saving..." : "Save Mapping"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
