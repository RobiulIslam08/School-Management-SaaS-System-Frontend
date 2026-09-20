/** Empty string stays empty in controlled inputs; only parse when submitting. */
export function parseOptionalNumber(value: string | number): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseNumberOrZero(value: string | number): number {
  return parseOptionalNumber(value) ?? 0;
}
