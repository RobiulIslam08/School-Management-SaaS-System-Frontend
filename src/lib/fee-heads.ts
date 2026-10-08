/** Official collection heads, in the order printed on the money receipt. */
export const FEE_HEADS = [
  "Monthly Tuition Fee",
  "Admission Fee",
  "Library Fee",
  "ID Card Fee",
  "Journal And Magazine Fee",
  "Common Room Fee",
  "Student Welfare Fee",
  "College Sports Fee",
  "Red Crescent Fee",
  "Seminar Fee",
  "BNCC Fee",
  "Religious Ceremony Fee",
  "Cultural Programme Fee",
  "College Development Fee",
  "Computerized Progress Report Card Fee",
  "SMS and Online Service Charge",
  "Uniform",
] as const;

export type FeeHead = (typeof FEE_HEADS)[number];

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Current month as on the slip, e.g. Sep26. */
export function defaultFeePeriod(date = new Date()): string {
  return `${SHORT_MONTHS[date.getMonth()]}${String(date.getFullYear()).slice(2)}`;
}

/** "Library Fee (Sep26)". A blank period keeps the bare head name. */
export function feeParticular(head: string, period: string): string {
  const month = period.trim();
  return month ? `${head} (${month})` : head;
}

/** Strip a trailing "(Sep26)" so "Library Fee (Sep26)" matches a "Library Fee" due. */
export function feeHeadName(title: string): string {
  const trimmed = title.trim();
  const match = trimmed.match(/^(.*)\s+\([^)]*\)$/);
  return (match?.[1] ?? trimmed).trim();
}

export function feeTitleMatchesHead(title: string, head: string): boolean {
  const value = title.trim();
  return value === head || value.startsWith(`${head} (`) || value.startsWith(`${head}(`);
}

export type FeeLedgerPick<T> = { kind: "pay"; ledger: T } | { kind: "over"; ledger: T };

/** Month-specific titles match that month or a bare head. They do not match another month. */
export function pickFeeLedger<T extends { title: string }>(
  open: T[],
  printed: string,
  amount: number,
  remainingOf: (row: T) => number
): FeeLedgerPick<T> | null {
  const head = feeHeadName(printed);
  const target = printed.trim();
  const withBalance = open.filter((row) => remainingOf(row) > 0 && feeTitleMatchesHead(row.title, head));
  const exact = withBalance.filter((row) => row.title.trim() === target);
  const bare = target === head ? [] : withBalance.filter((row) => row.title.trim() === head);
  const matches = exact.length ? exact : bare;
  if (!matches.length) return null;
  const fits = matches.filter((row) => remainingOf(row) >= amount);
  if (fits.length) return { kind: "pay", ledger: fits[0] };
  const blocked = [...matches].sort((a, b) => remainingOf(b) - remainingOf(a))[0];
  return { kind: "over", ledger: blocked };
}
