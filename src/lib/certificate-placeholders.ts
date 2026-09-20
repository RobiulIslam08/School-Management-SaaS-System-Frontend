export const CERTIFICATE_PLACEHOLDERS = [
  "student_name",
  "student_id",
  "class",
  "section",
  "roll",
  "group",
  "father_name",
  "mother_name",
  "session",
  "school_name",
  "eiin",
  "address",
  "purpose",
  "conduct",
  "leaving_date",
  "reason",
  "issue_date",
  "cert_no",
] as const;

export function fillPlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_full, key: string) => {
    const value = values[key];
    if (value == null || value === "") return "—";
    return value;
  });
}

export const SAMPLE_CERTIFICATE_VALUES: Record<string, string> = {
  school_name: "Demo High School",
  eiin: "123456",
  address: "Dhaka, Bangladesh",
  student_name: "রহিম উদ্দিন",
  student_id: "121201",
  roll: "05",
  class: "Class 8",
  section: "A",
  group: "",
  session: "2025-26",
  father_name: "করিম উদ্দিন",
  mother_name: "ফাতেমা বেগম",
  issue_date: "20/09/2026",
  purpose: "প্রয়োজনীয় কাজে",
  conduct: "উত্তম",
  leaving_date: "15/09/2026",
  reason: "অভিভাবকের স্থানান্তর",
  cert_no: "CHAR-2025-26-0001",
};
