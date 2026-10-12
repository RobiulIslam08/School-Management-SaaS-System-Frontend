import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export type AdmissionAddress = {
  holding?: string;
  area?: string;
  upazila?: string;
  postOffice?: string;
  district?: string;
  division?: string;
  road?: string;
  block?: string;
};

export type AdmissionFormData = {
  studentId?: string;
  name: string;
  nameBn?: string;
  phone?: string;
  email?: string;
  dob?: string;
  birthRegNo?: string;
  religion?: string;
  bloodGroup?: string;
  photoUrl?: string;
  courseName?: string;
  section?: string;
  fatherName?: string;
  fatherNameBn?: string;
  fatherPhone?: string;
  motherName?: string;
  motherNameBn?: string;
  motherPhone?: string;
  address?: AdmissionAddress;
  permanentAddress?: AdmissionAddress;
};

function dash(value?: string) {
  const v = value?.trim();
  return v || "—";
}

function FieldCell({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={`admission-cell flex min-w-0 border-b border-r border-foreground/25 ${wide ? "col-span-2 is-wide" : "col-span-1"}`}>
      <div className="flex w-[38%] max-w-[9.5rem] shrink-0 items-center bg-[#f3f0ea] px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-foreground print:bg-[#f3f0ea]">
        {label}
      </div>
      <div className="min-w-0 flex-1 px-3 py-1.5 text-[12px] font-medium leading-snug tracking-wide text-foreground">
        {dash(value)}
      </div>
    </div>
  );
}

function SectionTitle({ children, accent }: { children: string; accent?: string }) {
  return (
    <div
      className="border-b border-foreground/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
      style={{ background: accent || "#14532d" }}
    >
      {children}
    </div>
  );
}

function AddressPanel({
  title,
  address,
  accent,
}: {
  title: string;
  address?: AdmissionAddress;
  accent?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="min-w-0 overflow-hidden border border-foreground/40">
      <SectionTitle accent={accent}>{title}</SectionTitle>
      <div className="grid grid-cols-1">
        <FieldCell label={t.students.house} value={address?.holding || address?.block} />
        <FieldCell label={t.students.village} value={address?.area} />
        <FieldCell label={t.reports.upazila} value={address?.upazila} />
        <FieldCell label={t.students.postOffice} value={address?.postOffice || address?.road} />
        <FieldCell label={t.reports.district} value={address?.district} />
      </div>
    </div>
  );
}

/** Official A4 school admission form — dense, framed, print-ready (fits single page). */
export function AdmissionFormDocument({
  settings,
  data,
}: {
  settings?: SchoolSettings;
  data: AdmissionFormData;
}) {
  const { t } = useI18n();
  const accent = settings?.theme?.primary || "#14532d";

  return (
    <article
      className="admission-sheet mx-auto flex w-full max-w-[210mm] min-h-[278mm] flex-col bg-white text-foreground shadow-sm print:max-w-none print:shadow-none"
      style={{ ["--admission-accent" as string]: accent }}
    >
      <div className="admission-frame flex flex-1 flex-col border-[3px] border-foreground p-1 print:border-2">
        <div className="admission-inner flex flex-1 flex-col justify-between border border-foreground/70 p-3 sm:p-4 print:p-2.5">
          {/* Institutional header */}
          <header className="relative grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 pb-1.5 sm:grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] sm:gap-2">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-[color:var(--admission-accent)] bg-[#f8faf8] sm:h-16 sm:w-16">
              {settings?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoUrl} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-xl font-bold" style={{ color: accent }}>
                  {(settings?.name ?? "S").slice(0, 1)}
                </span>
              )}
            </div>

            <div className="min-w-0 text-center">
              {settings?.motto ? (
                <p className="text-[9.5px] italic leading-tight text-muted-foreground">{settings.motto}</p>
              ) : null}
              <h1
                className="mt-0.5 font-serif text-[1.1rem] font-extrabold uppercase leading-tight tracking-[0.03em] sm:text-[1.25rem]"
                style={{ color: accent }}
              >
                {settings?.name || "School"}
              </h1>
              {settings?.address ? (
                <p className="mt-0.5 text-[9.5px] leading-snug text-foreground/80">{settings.address}</p>
              ) : null}
              <p className="mt-0.5 text-[9.5px] font-medium leading-snug text-foreground/70">
                {settings?.eiin ? `${t.marksheets.eiin}: ${settings.eiin}` : null}
                {settings?.eiin && settings?.establishedYear ? "  |  " : null}
                {settings?.establishedYear ? `Est: ${settings.establishedYear}` : null}
                {(settings?.eiin || settings?.establishedYear) && settings?.academicYear ? "  |  " : null}
                {settings?.academicYear ? `${t.common.year}: ${settings.academicYear}` : null}
              </p>
            </div>

            <div className="relative h-14 w-14 overflow-hidden border-2 border-foreground bg-[#f8faf8] sm:h-16 sm:w-16">
              {data.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <p className="flex h-full items-center justify-center p-1 text-center text-[8.5px] leading-tight text-muted-foreground">
                  {t.students.photo}
                </p>
              )}
            </div>
          </header>

          {/* Title band */}
          <div
            className="mb-2 flex items-center justify-center border-y-2 border-foreground py-1.5"
            style={{ background: `color-mix(in srgb, ${accent} 12%, white)` }}
          >
            <h2 className="text-center text-[14px] font-extrabold uppercase tracking-[0.14em]" style={{ color: accent }}>
              {t.students.admissionFormTitle}
            </h2>
          </div>

          {/* Student particulars */}
          <section className="mb-2 overflow-hidden border border-foreground/40">
            <SectionTitle accent={accent}>{t.students.stepStudent}</SectionTitle>
            <div className="admission-grid grid grid-cols-2">
              <FieldCell label={t.students.studentName} value={data.name || data.nameBn} wide />
              <FieldCell label={t.students.id} value={data.studentId} />
              <FieldCell label={t.common.phone} value={data.phone} />
              <FieldCell label={t.students.courseName} value={data.courseName} />
              <FieldCell label={t.common.section} value={data.section} />
              <FieldCell label={t.students.dob} value={data.dob} />
              <FieldCell label={t.students.birthRegNo} value={data.birthRegNo} />
              <FieldCell label={t.common.religion} value={data.religion} />
              <FieldCell label={t.common.blood} value={data.bloodGroup} />
              <FieldCell label={t.common.email} value={data.email} wide />
            </div>
          </section>

          <section className="mb-2 overflow-hidden border border-foreground/40">
            <SectionTitle accent={accent}>{t.students.stepGuardian}</SectionTitle>
            <div className="admission-grid grid grid-cols-2">
              <FieldCell label={t.students.fatherNameLabel} value={data.fatherName || data.fatherNameBn} />
              <FieldCell label={t.students.fatherMobile} value={data.fatherPhone} />
              <FieldCell label={t.students.motherNameLabel} value={data.motherName || data.motherNameBn} />
              <FieldCell label={t.students.motherMobile} value={data.motherPhone} />
            </div>
          </section>

          <div className="admission-addresses mb-2 grid grid-cols-2 gap-2.5">
            <AddressPanel title={t.students.presentAddress} address={data.address} accent={accent} />
            <AddressPanel title={t.students.permanentAddress} address={data.permanentAddress || data.address} accent={accent} />
          </div>

          {/* Declaration */}
          <p className="my-1.5 text-[9.5px] leading-relaxed text-foreground/85">
            {t.students.admissionDeclaration}
          </p>

          {/* Signatures */}
          <div className="admission-signs mt-3 pt-2 grid grid-cols-2 gap-10">
            <div className="text-center">
              <div className="mx-auto mb-1.5 h-10 w-full max-w-[12rem] border-b border-foreground" />
              <p className="text-[11px] font-semibold">{t.common.guardian}</p>
              <p className="text-[9px] text-muted-foreground">{t.students.signatureHint}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-1.5 h-10 w-full max-w-[12rem] border-b border-foreground" />
              <p className="text-[11px] font-semibold">{t.staff.admin}</p>
              <p className="text-[9px] text-muted-foreground">{t.students.sealHint}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
