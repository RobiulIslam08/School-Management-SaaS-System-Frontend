"use client";

import { useI18n } from "@/lib/i18n";
import type { SchoolSettings } from "@/lib/types";
import { toLocalYmd } from "@/lib/utils";

export type RegisterStaff = {
  _id: string;
  name: string;
  staffId?: string;
  designation?: string;
};

export type RegisterMark = {
  date: string;
  status: string;
  teacherId?: string | { _id?: string };
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function teacherIdOf(mark: RegisterMark): string {
  if (!mark.teacherId) return "";
  if (typeof mark.teacherId === "string") return mark.teacherId;
  return mark.teacherId._id ?? "";
}

function eachDay(from: string, to: string): string[] {
  const [y, m, d] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const cursor = new Date(y, m - 1, d);
  const end = new Date(y2, m2 - 1, d2);
  const days: string[] = [];
  while (cursor <= end) {
    days.push(toLocalYmd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function codeFor(status: string | undefined, codes: { present: string; absent: string; late: string; leave: string }) {
  if (status === "present") return codes.present;
  if (status === "absent") return codes.absent;
  if (status === "late") return codes.late;
  if (status === "leave") return codes.leave;
  return "";
}

export function StaffAttendanceRegister({
  kind,
  from,
  to,
  staff,
  marks,
  settings,
}: {
  kind: "month" | "year";
  from: string;
  to: string;
  staff: RegisterStaff[];
  marks: RegisterMark[];
  settings?: Partial<SchoolSettings> | null;
}) {
  const { t, locale } = useI18n();
  const schoolName = settings?.name?.trim() || "School";
  const logoUrl = settings?.logoUrl?.trim() || "";
  const codes = {
    present: t.staffAttendance.presentShort,
    absent: t.staffAttendance.absentShort,
    late: t.staffAttendance.lateShort,
    leave: t.staffAttendance.leaveShort,
  };

  const byStaff = new Map<string, Map<string, string>>();
  for (const mark of marks) {
    const id = teacherIdOf(mark);
    if (!id || !mark.date) continue;
    const days = byStaff.get(id) ?? new Map<string, string>();
    days.set(mark.date.slice(0, 10), mark.status);
    byStaff.set(id, days);
  }

  const year = from.slice(0, 4);
  const monthIndex = Number(from.slice(5, 7)) - 1;
  const monthLabel =
    kind === "month"
      ? new Date(Number(year), monthIndex, 1).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
          month: "long",
          year: "numeric",
        })
      : year;
  const title = kind === "month" ? t.staffAttendance.registerMonthly : t.staffAttendance.registerYearly;
  const days = kind === "month" ? eachDay(from, to) : [];
  const monthNames = Array.from({ length: 12 }, (_, index) =>
    new Date(2026, index, 1).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { month: "short" })
  );

  return (
    <article
      className={`staff-register-sheet mx-auto border-[3px] border-foreground bg-white text-foreground ${
        kind === "month" ? "monthly max-w-[297mm]" : "yearly max-w-[210mm]"
      }`}
    >
      {kind === "month" ? (
        <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } }`}</style>
      ) : null}
      <div className="border border-foreground/70 p-4">
        <header className="grid grid-cols-[3.25rem_1fr] items-center gap-3 border-b-2 border-foreground pb-3">
          <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center overflow-hidden rounded-full border-2 border-foreground">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
            ) : (
              <span className="text-lg font-bold">{schoolName.slice(0, 1)}</span>
            )}
          </div>
          <div className="min-w-0 text-center">
            <h1 className="break-words text-base font-extrabold uppercase tracking-wide sm:text-lg">{schoolName}</h1>
            <p className="text-[11px]">
              {settings?.address ? <span>{settings.address}</span> : null}
              {settings?.address && settings?.eiin ? "  ·  " : null}
              {settings?.eiin ? <span>{`${t.marksheets.eiin}: ${settings.eiin}`}</span> : null}
            </p>
            <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em]">
              {title}
              {monthLabel ? ` · ${monthLabel}` : ""}
            </p>
            {kind === "year" ? (
              <p className="text-[11px] text-muted-foreground">{t.staffAttendance.daysPresent}</p>
            ) : null}
          </div>
        </header>

        {kind === "month" ? (
          <>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {codes.present} {t.staffAttendance.present} · {codes.absent} {t.staffAttendance.absent} · {codes.late}{" "}
              {t.staffAttendance.late} · {codes.leave} {t.staffAttendance.leave}
            </p>
            <div className="mt-2 overflow-x-auto print:overflow-visible">
            <table className="w-max min-w-full border-collapse text-[9px] print:w-full">
              <thead>
                <tr className="border-y border-foreground text-center">
                  <th className="w-6 py-1 text-left">{t.fees.slNo}</th>
                  <th className="min-w-[7.5rem] py-1 text-left">{t.common.name}</th>
                  {days.map((iso) => (
                    <th key={iso} className="py-1 font-medium">
                      {Number(iso.slice(8, 10))}
                    </th>
                  ))}
                  <th className="py-1">{codes.present}</th>
                  <th className="py-1">{codes.absent}</th>
                  <th className="py-1">{codes.late}</th>
                  <th className="py-1">{codes.leave}</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((person, index) => {
                  const saved = byStaff.get(person._id) ?? new Map<string, string>();
                  const counts = { present: 0, absent: 0, late: 0, leave: 0 };
                  for (const status of saved.values()) {
                    if (status === "present" || status === "absent" || status === "late" || status === "leave") {
                      counts[status] += 1;
                    }
                  }
                  return (
                    <tr key={person._id} className="border-b border-foreground/20">
                      <td className="py-1 tabular-nums">{index + 1}</td>
                      <td className="py-1 pr-1 text-left">
                        <div className="font-medium leading-tight">{person.name}</div>
                        <div className="text-[8px] text-muted-foreground">
                          {[person.staffId, person.designation].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      {days.map((iso) => (
                        <td key={iso} className="py-1 text-center font-medium">
                          {codeFor(saved.get(iso), codes)}
                        </td>
                      ))}
                      <td className="py-1 text-center tabular-nums">{counts.present}</td>
                      <td className="py-1 text-center tabular-nums">{counts.absent}</td>
                      <td className="py-1 text-center tabular-nums">{counts.late}</td>
                      <td className="py-1 text-center tabular-nums">{counts.leave}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        ) : (
          <div className="mt-3 overflow-x-auto print:overflow-visible">
          <table className="w-max min-w-full border-collapse text-xs print:w-full">
            <thead>
              <tr className="border-y-2 border-foreground text-center">
                <th className="w-8 py-1.5 text-left">{t.fees.slNo}</th>
                <th className="py-1.5 text-left">{t.common.name}</th>
                {monthNames.map((name, index) => (
                  <th key={MONTHS[index]} className="py-1.5 font-medium">
                    {name}
                  </th>
                ))}
                <th className="py-1.5">{t.staffAttendance.yearlyTotal}</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person, index) => {
                const saved = byStaff.get(person._id) ?? new Map<string, string>();
                const months = Array.from({ length: 12 }, (_, month) => {
                  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
                  let present = 0;
                  let marked = false;
                  for (const [iso, status] of saved) {
                    if (!iso.startsWith(prefix)) continue;
                    marked = true;
                    if (status === "present") present += 1;
                  }
                  return marked ? present : null;
                });
                const total = months.reduce<number>((sum, value) => sum + (value ?? 0), 0);
                return (
                  <tr key={person._id} className="border-b border-foreground/20">
                    <td className="py-1.5 tabular-nums">{index + 1}</td>
                    <td className="py-1.5 text-left">
                      <div className="font-medium">{person.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {[person.staffId, person.designation].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    {months.map((present, month) => (
                      <td key={MONTHS[month]} className="py-1.5 text-center tabular-nums">
                        {present === null ? "" : present}
                      </td>
                    ))}
                    <td className="py-1.5 text-center font-semibold tabular-nums">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        <div className="mt-10 flex justify-end text-center text-[11px]">
          <div className="w-40">
            <div className="mb-1 h-8 border-b border-foreground" />
            <p className="font-semibold">{t.staff.admin}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
