import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { SchoolLetterhead, SignatureRow } from "./school-letterhead";

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

export function CertificateDocument({
  item,
  settings,
}: {
  item: IssuedCertificate;
  settings?: SchoolSettings;
}) {
  const { t, locale } = useI18n();
  const issued = new Date(item.issueDate).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB");

  return (
    <SchoolLetterhead settings={settings} title={item.renderedTitle} subtitle={`${t.certificates.number}: ${item.certNo}`}>
      <p className="mt-6 text-justify text-[15px] leading-8">{item.renderedBody}</p>
      <p className="mt-8 text-sm">
        {t.marksheets.issued}: {issued}
        {item.issuedByName ? ` · ${item.issuedByName}` : ""}
      </p>
      <SignatureRow lines={[t.certificates.office, t.marksheets.head]} />
    </SchoolLetterhead>
  );
}
