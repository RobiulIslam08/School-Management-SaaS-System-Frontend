import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { SchoolLetterhead, SignatureRow } from "./school-letterhead";

type Student = {
  name?: string;
  nameBn?: string;
  studentId?: string;
  rollNo?: string;
  section?: string;
  group?: string;
  academicYear?: string;
  guardian?: { fatherName?: string };
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
  subjectId?: { name?: string; markDistribution?: { cq?: number; mcq?: number; practical?: number } };
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
}: {
  row: MarksheetRow;
  settings?: SchoolSettings;
}) {
  const { t, locale } = useI18n();
  const student = row.studentId;
  const subjects = row.subjectMarks ?? [];
  const failed = row.letter === "F" || subjects.some((item) => item.letter === "F");
  const issued = new Date().toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB");

  return (
    <SchoolLetterhead
      settings={settings}
      title={t.marksheets.transcript}
      subtitle={`${t.marksheets.transcriptEn} · ${row.examTypeId?.name ?? ""} · ${row.examTypeId?.academicYear ?? row.academicYear ?? settings?.academicYear ?? ""}`}
    >

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-3">
        <Info label={t.common.name} value={student?.nameBn || student?.name} />
        <Info label={t.common.class} value={student?.classId?.name} />
        <Info label={t.marksheets.roll} value={student?.rollNo} />
        <Info label={t.marksheets.id} value={student?.studentId} />
        <Info label={t.common.section} value={student?.section} />
        <Info label={t.marksheets.group} value={student?.group && student.group !== "None" ? student.group : "—"} />
        <Info label={t.marksheets.father} value={student?.guardian?.fatherName} />
        <Info label={t.common.year} value={student?.academicYear ?? row.academicYear} />
        <Info label={t.marksheets.position} value={row.meritPosition ? String(row.meritPosition) : "—"} />
      </dl>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted text-center text-xs font-semibold uppercase">
            <th className="border border-foreground px-2 py-2">{t.marksheets.sl}</th>
            <th className="border border-foreground px-2 py-2 text-left">{t.marksheets.subject}</th>
            <th className="border border-foreground px-2 py-2">{t.marksheets.full}</th>
            <th className="border border-foreground px-2 py-2">{t.results.cq}</th>
            <th className="border border-foreground px-2 py-2">{t.results.mcq}</th>
            <th className="border border-foreground px-2 py-2">{t.results.practical}</th>
            <th className="border border-foreground px-2 py-2">{t.marksheets.obtained}</th>
            <th className="border border-foreground px-2 py-2">{t.marksheets.grade}</th>
            <th className="border border-foreground px-2 py-2">{t.marksheets.gpa}</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((item, index) => (
            <tr key={`${row._id}-${index}`} className="text-center">
              <td className="border border-foreground px-2 py-1.5">{index + 1}</td>
              <td className="border border-foreground px-2 py-1.5 text-left">{item.subjectId?.name ?? "—"}</td>
              <td className="border border-foreground px-2 py-1.5">{dash(item.full)}</td>
              <td className="border border-foreground px-2 py-1.5">{dash(item.cq)}</td>
              <td className="border border-foreground px-2 py-1.5">{dash(item.mcq)}</td>
              <td className="border border-foreground px-2 py-1.5">{item.practical ? item.practical : "—"}</td>
              <td className="border border-foreground px-2 py-1.5 font-medium">{dash(item.obtained)}</td>
              <td className="border border-foreground px-2 py-1.5">{dash(item.letter)}</td>
              <td className="border border-foreground px-2 py-1.5">{item.gpa?.toFixed?.(2) ?? dash(item.gpa)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-center font-semibold">
            <td className="border border-foreground px-2 py-2" colSpan={2}>
              {t.marksheets.total}
            </td>
            <td className="border border-foreground px-2 py-2">{dash(row.totalFull)}</td>
            <td className="border border-foreground px-2 py-2" colSpan={3} />
            <td className="border border-foreground px-2 py-2">{dash(row.totalObtained)}</td>
            <td className="border border-foreground px-2 py-2">{dash(row.letter)}</td>
            <td className="border border-foreground px-2 py-2">{row.gpa?.toFixed?.(2) ?? row.gpa}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
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
          <strong>{failed ? t.marksheets.fail : t.marksheets.pass}</strong>
        </p>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide">{t.marksheets.scale}</p>
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="border border-foreground px-1 py-1">{t.marksheets.obtained}</th>
              {GPA_BANDS.map((band) => (
                <th key={band.grade} className="border border-foreground px-1 py-1">
                  {band.range}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              <td className="border border-foreground px-1 py-1">{t.marksheets.grade}</td>
              {GPA_BANDS.map((band) => (
                <td key={band.grade} className="border border-foreground px-1 py-1">
                  {band.grade}
                </td>
              ))}
            </tr>
            <tr className="text-center">
              <td className="border border-foreground px-1 py-1">{t.marksheets.gpa}</td>
              {GPA_BANDS.map((band) => (
                <td key={`g-${band.grade}`} className="border border-foreground px-1 py-1">
                  {band.gpa}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <SignatureRow lines={[t.marksheets.classTeacher, t.marksheets.guardian, t.marksheets.head]} />
      <p className="mt-6 text-right text-xs text-muted-foreground">
        {t.marksheets.issued}: {issued}
      </p>
    </SchoolLetterhead>
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
