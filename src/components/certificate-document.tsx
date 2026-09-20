import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export type IssuedCertificate = {
  _id: string;
  certNo: string;
  kind: string;
  issueDate: string;
  purpose?: string;
  conduct?: string;
  language: "bn" | "en";
  issuedByName?: string;
  renderedTitle: string;
  renderedBody: string;
  studentId?: {
    name?: string;
    studentId?: string;
    rollNo?: string;
    section?: string;
    classId?: { name?: string };
  };
};

function SchoolCrest({
  logoUrl,
  name,
  size = "md",
}: {
  logoUrl?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-14 w-14",
    md: "h-20 w-20 sm:h-24 sm:w-24",
    lg: "h-28 w-28",
  };
  const monogram = (name ?? "S").trim().slice(0, 1).toUpperCase();

  return (
    <div
      className={`certificate-crest relative mx-auto flex ${sizes[size]} items-center justify-center overflow-hidden rounded-full border-[3px] border-foreground bg-white shadow-sm`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name ? `${name} logo` : "School logo"} className="h-full w-full object-contain p-1.5" />
      ) : (
        <span className="text-2xl font-bold tracking-wide text-foreground sm:text-3xl" aria-hidden>
          {monogram}
        </span>
      )}
    </div>
  );
}

export function CertificateDocument({
  item,
  settings,
  draft,
}: {
  item: Pick<IssuedCertificate, "certNo" | "renderedTitle" | "renderedBody" | "issueDate" | "issuedByName" | "language">;
  settings?: SchoolSettings;
  draft?: boolean;
}) {
  const { t, locale } = useI18n();
  const issued = new Date(item.issueDate).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB");
  const schoolName = settings?.name?.trim() || "School";
  const logoUrl = settings?.logoUrl?.trim() || "";

  return (
    <article className="certificate-sheet relative mx-auto max-w-[210mm] overflow-hidden bg-white text-foreground shadow-[0_8px_30px_rgba(28,25,23,0.08)] print:max-w-none print:shadow-none">
      {/* Outer ornate frame */}
      <div className="certificate-frame relative border-[3px] border-foreground p-[5px]">
        <div className="relative border border-foreground px-5 py-7 sm:px-10 sm:py-10">
          {/* Corner ornaments */}
          <span className="certificate-corner certificate-corner-tl" aria-hidden />
          <span className="certificate-corner certificate-corner-tr" aria-hidden />
          <span className="certificate-corner certificate-corner-bl" aria-hidden />
          <span className="certificate-corner certificate-corner-br" aria-hidden />

          {/* Watermark — logo or monogram behind body */}
          <div className="certificate-watermark pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-[55%] w-[55%] max-h-[280px] max-w-[280px] object-contain" />
            ) : (
              <span className="select-none text-[9rem] font-bold leading-none tracking-tight sm:text-[11rem]">
                {schoolName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          <div className="relative z-10">
            {draft ? (
              <p className="no-print mb-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t.certificates.draftPreview}
              </p>
            ) : null}

            <header className="relative border-b-2 border-foreground pb-5 text-center">
              <div className="mb-1 flex items-start justify-between gap-3 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                <span className="min-w-0 flex-1 text-left">
                  {settings?.academicYear ? `${t.common.year}: ${settings.academicYear}` : null}
                </span>
                <span className="shrink-0 text-right font-medium normal-case tracking-normal text-foreground">
                  {t.certificates.number}: <span className="font-semibold">{item.certNo}</span>
                </span>
              </div>

              <div className="mt-2">
                <SchoolCrest logoUrl={logoUrl || undefined} name={schoolName} size="md" />
              </div>

              <h1 className="mt-3 text-xl font-bold uppercase leading-snug tracking-[0.04em] sm:text-2xl">
                {schoolName}
              </h1>
              {settings?.address ? (
                <p className="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{settings.address}</p>
              ) : null}
              <p className="mt-1.5 text-xs text-muted-foreground">
                {settings?.eiin ? `${t.marksheets.eiin}: ${settings.eiin}` : null}
                {settings?.establishedYear ? ` · Est. ${settings.establishedYear}` : null}
              </p>
              {settings?.motto ? (
                <p className="mt-2 text-xs italic tracking-wide text-muted-foreground">&ldquo;{settings.motto}&rdquo;</p>
              ) : null}

              <div className="mx-auto mt-5 flex max-w-md items-center gap-3">
                <span className="h-px flex-1 bg-foreground/40" />
                <p className="shrink-0 text-base font-bold uppercase tracking-[0.14em] sm:text-lg">{item.renderedTitle}</p>
                <span className="h-px flex-1 bg-foreground/40" />
              </div>
            </header>

            <p className="mt-8 text-justify text-[15px] leading-[1.95] tracking-wide">{item.renderedBody}</p>

            <div className="mt-10 flex flex-wrap items-end justify-between gap-8 text-sm">
              <div>
                <p>
                  {t.marksheets.issued}: <span className="font-semibold">{issued}</span>
                </p>
                {item.issuedByName ? (
                  <p className="mt-1 text-muted-foreground">
                    {t.certificates.issuedBy}: {item.issuedByName}
                  </p>
                ) : null}
              </div>

              {/* Official seal — uses school logo when available */}
              <div className="certificate-seal flex h-[4.75rem] w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-full border-2 border-foreground/70 bg-white/80 p-1 text-center">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-10 w-10 object-contain opacity-90" />
                ) : null}
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.certificates.seal}
                </span>
              </div>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-10 text-center text-xs sm:gap-16">
              <div>
                <div className="mx-auto mb-2 h-10 max-w-[11rem] border-b border-foreground" />
                <p className="font-medium">{t.certificates.office}</p>
              </div>
              <div>
                <div className="mx-auto mb-2 h-10 max-w-[11rem] border-b border-foreground" />
                <p className="font-medium">{t.marksheets.head}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
