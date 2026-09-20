import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export type NoticeSignatory = {
  name?: string;
  designation?: string;
};

export type NoticeDocumentData = {
  title: string;
  body: string;
  refNo?: string;
  issueDate?: string;
  category?: string;
  signatories?: NoticeSignatory[];
  createdByName?: string;
  audience?: string;
  pinned?: boolean;
};

function SchoolCrest({
  logoUrl,
  name,
}: {
  logoUrl?: string;
  name?: string;
}) {
  const monogram = (name ?? "S").trim().slice(0, 1).toUpperCase();
  return (
    <div className="notice-crest relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-foreground bg-white sm:h-20 sm:w-20">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name ? `${name} logo` : "School logo"} className="h-full w-full object-contain p-1.5" />
      ) : (
        <span className="text-xl font-bold tracking-wide text-foreground sm:text-2xl" aria-hidden>
          {monogram}
        </span>
      )}
    </div>
  );
}

const DEFAULT_SIGNATORIES: NoticeSignatory[] = [
  { name: "", designation: "প্রধান শিক্ষক" },
  { name: "", designation: "সহকারী প্রধান শিক্ষক" },
];

function NoticeBodyText({ text, placeholder }: { text?: string; placeholder: string }) {
  const raw = (text ?? "").replace(/\r\n/g, "\n").trimEnd();
  if (!raw.trim()) {
    return <p className="text-muted-foreground">{placeholder}</p>;
  }

  const blocks = raw.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <>
      {blocks.map((block, index) => (
        <p key={index} className="notice-body-para">
          {block.split("\n").map((line, lineIndex, lines) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

export function NoticeDocument({
  item,
  settings,
  draft,
}: {
  item: NoticeDocumentData;
  settings?: Partial<SchoolSettings> | null;
  draft?: boolean;
}) {
  const { t, locale } = useI18n();
  const schoolName = settings?.name?.trim() || "School";
  const logoUrl = settings?.logoUrl?.trim() || "";
  const issueSource = item.issueDate || new Date().toISOString();
  const issued = new Date(issueSource).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const signatories =
    item.signatories?.filter((s) => s.name?.trim() || s.designation?.trim()).length
      ? item.signatories.filter((s) => s.name?.trim() || s.designation?.trim()).slice(0, 3)
      : DEFAULT_SIGNATORIES;

  return (
    <article className="notice-sheet relative mx-auto w-full max-w-[210mm] min-w-0 overflow-x-hidden bg-white text-foreground shadow-[0_8px_30px_rgba(28,25,23,0.08)] print:max-w-none print:shadow-none">
      <div className="relative min-w-0 border border-foreground/80 px-6 py-8 sm:px-10 sm:py-10">
        {draft ? (
          <p className="no-print mb-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t.notices.draftPreview}
          </p>
        ) : null}

        <header className="border-b border-foreground/30 pb-5">
          <div className="flex min-w-0 items-start gap-4">
            <SchoolCrest logoUrl={logoUrl || undefined} name={schoolName} />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="break-words text-lg font-bold uppercase leading-snug tracking-[0.03em] sm:text-xl">
                {schoolName}
              </h1>
              {settings?.address ? (
                <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">{settings.address}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {settings?.eiin ? `${t.marksheets.eiin}: ${settings.eiin}` : null}
                {settings?.establishedYear ? ` · Est. ${settings.establishedYear}` : null}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-foreground/20 pt-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t.notices.documentLabel}</p>
              <p className="mt-0.5 text-base font-bold tracking-wide sm:text-lg">{t.notices.documentTitle}</p>
            </div>
            <div className="min-w-0 text-right text-sm">
              {item.refNo ? (
                <p className="break-all">
                  {t.notices.refNo}: <span className="font-semibold">{item.refNo}</span>
                </p>
              ) : null}
              <p className="mt-0.5">
                {t.notices.issueDate}: <span className="font-semibold">{issued}</span>
              </p>
            </div>
          </div>
        </header>

        <div className="mt-8 min-w-0">
          <h2 className="break-words text-center text-lg font-bold underline decoration-foreground/40 decoration-1 underline-offset-4 sm:text-xl">
            {item.title || t.notices.heading}
          </h2>
          <div className="notice-body mt-6 min-w-0 w-full text-justify text-[15px] leading-[1.95]">
            <NoticeBodyText text={item.body} placeholder={t.notices.bodyPlaceholder} />
          </div>
        </div>

        {item.createdByName ? (
          <p className="mt-8 text-sm text-muted-foreground">
            {t.notices.issuedBy}: {item.createdByName}
          </p>
        ) : null}

        <div
          className={`mt-16 grid gap-10 text-center text-xs sm:gap-12 ${
            signatories.length === 1
              ? "grid-cols-1 place-items-center"
              : signatories.length === 2
                ? "grid-cols-2"
                : "grid-cols-1 sm:grid-cols-3"
          }`}
        >
          {signatories.map((signer, index) => (
            <div key={`${signer.designation}-${index}`} className="min-w-0">
              <div className="mx-auto mb-2 h-12 max-w-[12rem] border-b border-foreground" />
              {signer.name?.trim() ? <p className="font-semibold">{signer.name.trim()}</p> : null}
              <p className="font-medium text-muted-foreground">
                {signer.designation?.trim() || t.notices.signatory}
              </p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
