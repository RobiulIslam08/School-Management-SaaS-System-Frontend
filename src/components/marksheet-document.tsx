import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

type Student = {
  name?: string;
  nameBn?: string;
  studentId?: string;
  rollNo?: string;
  section?: string;
  group?: string;
  academicYear?: string;
  guardian?: { fatherName?: string; motherName?: string };
  classId?: { name?: string };
};

type SubjectMark = {
  cq?: number;
  mcq?: number;
  practical?: number;
  attendance?: number;
  obtained?: number;
  full?: number;
  gpa?: number;
  letter?: string;
  subjectId?: {
    name?: string;
    markDistribution?: { cq?: number; mcq?: number; practical?: number; attendance?: number };
  };
};

export type MarksheetRow = {
  _id: string;
  gpa: number;
  letter: string;
  totalObtained: number;
  totalFull: number;
  meritPosition?: number | null;
  academicYear?: string;
  studentId?: Student;
  examTypeId?: { name?: string; academicYear?: string };
  subjectMarks?: SubjectMark[];
};

const GPA_BANDS = [
  { range: "80–100", grade: "A+", gpa: "5.00" },
  { range: "70–79", grade: "A", gpa: "4.00" },
  { range: "60–69", grade: "A−", gpa: "3.50" },
  { range: "50–59", grade: "B", gpa: "3.00" },
  { range: "40–49", grade: "C", gpa: "2.00" },
  { range: "33–39", grade: "D", gpa: "1.00" },
  { range: "0–32", grade: "F", gpa: "0.00" },
];

function dash(value?: string | number | null): string {
  if (value === 0) return "0";
  if (value == null || value === "") return "—";
  return String(value);
}

export function MarksheetDocument({
  row,
  settings,
  expectedSubjects,
  selected,
}: {
  row: MarksheetRow;
  settings?: SchoolSettings;
  expectedSubjects?: number;
  selected?: boolean;
}) {
  const { t, locale } = useI18n();
  const student = row.studentId;
  const subjects = row.subjectMarks ?? [];
  const failed = row.letter === "F" || subjects.some((item) => item.letter === "F");
  const incomplete = expectedSubjects != null && expectedSubjects > 0 && subjects.length < expectedSubjects;
  const issued = new Date().toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB");
  const schoolName = settings?.name?.trim() || "School";
  const logoUrl = settings?.logoUrl?.trim() || "";
  const showAttendance = subjects.some((item) => (item.subjectId?.markDistribution?.attendance ?? item.attendance ?? 0) > 0);
  const showPractical = subjects.some((item) => (item.subjectId?.markDistribution?.practical ?? item.practical ?? 0) > 0);

  return (
    <article
      data-marksheet-id={row._id}
      data-selected={selected ? "1" : "0"}
      className="marksheet-sheet certificate-sheet relative mx-auto max-w-[210mm] overflow-hidden bg-white text-foreground shadow-[0_8px_30px_rgba(28,25,23,0.08)] print:max-w-none print:shadow-none"
    >
      <div className="certificate-frame relative border-[3px] border-foreground p-[5px]">
        <div className="relative border border-foreground px-5 py-6 sm:px-8 sm:py-8">
          <span className="certificate-corner certificate-corner-tl" aria-hidden />
          <span className="certificate-corner certificate-corner-tr" aria-hidden />
          <span className="certificate-corner certificate-corner-bl" aria-hidden />
          <span className="certificate-corner certificate-corner-br" aria-hidden />

          <div className="certificate-watermark pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-[50%] w-[50%] max-h-[240px] max-w-[240px] object-contain" />
            ) : (
              <span className="select-none text-[8rem] font-bold leading-none sm:text-[10rem]">
                {schoolName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          <div className="relative z-10">
            <header className="border-b-2 border-foreground pb-4 text-center">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`${schoolName} logo`}
                  className="certificate-crest mx-auto mb-2 h-16 w-16 rounded-full border-2 border-foreground object-contain p-1"
                />
              ) : (
                <div className="certificate-crest mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground text-xl font-bold">
                  {schoolName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <h1 className="text-xl font-bold uppercase tracking-[0.04em] sm:text-2xl">{schoolName}</h1>
              {settings?.address ? <p className="mt-1 text-sm text-muted-foreground">{settings.address}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {settings?.eiin ? `${t.marksheets.eiin}: ${settings.eiin}` : null}
                {settings?.establishedYear ? ` · Est. ${settings.establishedYear}` : null}
              </p>
              {settings?.motto ? <p className="mt-1 text-xs italic text-muted-foreground">&ldquo;{settings.motto}&rdquo;</p> : null}
              <p className="mt-3 text-lg font-bold uppercase tracking-[0.12em]">{t.marksheets.transcript}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.marksheets.transcriptEn} · {row.examTypeId?.name ?? ""} ·{" "}
                {row.examTypeId?.academicYear ?? row.academicYear ?? settings?.academicYear ?? ""}
              </p>
              {incomplete ? (
                <p className="no-print mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {t.marksheets.incomplete}
                </p>
              ) : null}
            </header>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm md:grid-cols-3">
              <Info label={t.common.name} value={student?.nameBn || student?.name} />
              {student?.nameBn && student?.name && student.nameBn !== student.name ? (
                <Info label={`${t.common.name} (EN)`} value={student.name} />
              ) : null}
              <Info label={t.common.class} value={student?.classId?.name} />
              <Info label={t.marksheets.roll} value={student?.rollNo} />
              <Info label={t.marksheets.id} value={student?.studentId} />
              <Info label={t.common.section} value={student?.section} />
              <Info label={t.marksheets.group} value={student?.group && student.group !== "None" ? student.group : "—"} />
              <Info label={t.marksheets.father} value={student?.guardian?.fatherName} />
              <Info label={t.marksheets.mother} value={student?.guardian?.motherName} />
              <Info label={t.common.year} value={student?.academicYear ?? row.academicYear} />
              <Info label={t.marksheets.position} value={row.meritPosition ? String(row.meritPosition) : "—"} />
            </dl>

            <table className="mt-5 w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-muted/80 text-center text-[11px] font-semibold uppercase">
                  <th className="border border-foreground px-1.5 py-2">{t.marksheets.sl}</th>
                  <th className="border border-foreground px-1.5 py-2 text-left">{t.marksheets.subject}</th>
                  <th className="border border-foreground px-1.5 py-2">{t.marksheets.full}</th>
                  <th className="border border-foreground px-1.5 py-2">{t.results.cq}</th>
                  <th className="border border-foreground px-1.5 py-2">{t.results.mcq}</th>
                  {showPractical ? <th className="border border-foreground px-1.5 py-2">{t.results.practical}</th> : null}
                  {showAttendance ? <th className="border border-foreground px-1.5 py-2">{t.results.attendance}</th> : null}
                  <th className="border border-foreground px-1.5 py-2">{t.marksheets.obtained}</th>
                  <th className="border border-foreground px-1.5 py-2">{t.marksheets.grade}</th>
                  <th className="border border-foreground px-1.5 py-2">{t.marksheets.gpa}</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((item, index) => (
                  <tr key={`${row._id}-${index}`} className="text-center">
                    <td className="border border-foreground px-1.5 py-1">{index + 1}</td>
                    <td className="border border-foreground px-1.5 py-1 text-left">{item.subjectId?.name ?? "—"}</td>
                    <td className="border border-foreground px-1.5 py-1">{dash(item.full)}</td>
                    <td className="border border-foreground px-1.5 py-1">{dash(item.cq)}</td>
                    <td className="border border-foreground px-1.5 py-1">{dash(item.mcq)}</td>
                    {showPractical ? (
                      <td className="border border-foreground px-1.5 py-1">{item.practical != null ? item.practical : "—"}</td>
                    ) : null}
                    {showAttendance ? (
                      <td className="border border-foreground px-1.5 py-1">{item.attendance != null ? item.attendance : "—"}</td>
                    ) : null}
                    <td className="border border-foreground px-1.5 py-1 font-medium">{dash(item.obtained)}</td>
                    <td className="border border-foreground px-1.5 py-1">{dash(item.letter)}</td>
                    <td className="border border-foreground px-1.5 py-1">{item.gpa?.toFixed?.(2) ?? dash(item.gpa)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-center font-semibold">
                  <td className="border border-foreground px-1.5 py-2" colSpan={2}>
                    {t.marksheets.total}
                  </td>
                  <td className="border border-foreground px-1.5 py-2">{dash(row.totalFull)}</td>
                  <td className="border border-foreground px-1.5 py-2" colSpan={2 + (showPractical ? 1 : 0) + (showAttendance ? 1 : 0)} />
                  <td className="border border-foreground px-1.5 py-2">{dash(row.totalObtained)}</td>
                  <td className="border border-foreground px-1.5 py-2">{dash(row.letter)}</td>
                  <td className="border border-foreground px-1.5 py-2">{row.gpa?.toFixed?.(2) ?? row.gpa}</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 text-sm">
              <div className="grid gap-1 sm:grid-cols-3 sm:gap-6">
                <p>
                  <span className="text-muted-foreground">{t.marksheets.gpa}: </span>
                  <strong>{row.gpa?.toFixed?.(2) ?? row.gpa}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">{t.marksheets.grade}: </span>
                  <strong>{row.letter}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">{t.marksheets.remarks}: </span>
                  <strong>{failed ? t.marksheets.fail : incomplete ? t.marksheets.incomplete : t.marksheets.pass}</strong>
                </p>
              </div>
              <div className="certificate-seal flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-foreground/70 bg-white/80 p-1">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-8 w-8 object-contain opacity-90" />
                ) : null}
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{t.marksheets.seal}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t.marksheets.scale}</p>
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr>
                    <th className="border border-foreground px-1 py-0.5">{t.marksheets.obtained}</th>
                    {GPA_BANDS.map((band) => (
                      <th key={band.grade} className="border border-foreground px-1 py-0.5">
                        {band.range}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center">
                    <td className="border border-foreground px-1 py-0.5">{t.marksheets.grade}</td>
                    {GPA_BANDS.map((band) => (
                      <td key={band.grade} className="border border-foreground px-1 py-0.5">
                        {band.grade}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-center">
                    <td className="border border-foreground px-1 py-0.5">{t.marksheets.gpa}</td>
                    {GPA_BANDS.map((band) => (
                      <td key={`g-${band.grade}`} className="border border-foreground px-1 py-0.5">
                        {band.gpa}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 text-center text-xs">
              {[t.marksheets.classTeacher, t.marksheets.examController, t.marksheets.head].map((label) => (
                <div key={label}>
                  <div className="mx-auto mb-2 h-8 max-w-[9rem] border-b border-foreground" />
                  <p className="font-medium">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-right text-xs text-muted-foreground">
              {t.marksheets.issued}: {issued}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{dash(value)}</dd>
    </div>
  );
}
