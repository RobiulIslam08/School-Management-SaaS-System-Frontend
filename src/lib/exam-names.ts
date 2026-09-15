export function examNameKey(name: string): string {
  const compact = name.toLowerCase().replace(/[\s._-]+/g, "");
  if (["final", "finalexam", "বার্ষিক", "annual", "annualexam"].includes(compact) || compact.includes("ফাইনাল")) {
    return "final";
  }
  return compact;
}

export function duplicateExamLabels(exams: Array<{ name: string }>): string[] {
  const groups = new Map<string, string[]>();
  for (const exam of exams) {
    const key = examNameKey(exam.name);
    const list = groups.get(key) ?? [];
    list.push(exam.name);
    groups.set(key, list);
  }
  return [...groups.values()]
    .filter((names) => names.length > 1)
    .map((names) => [...new Set(names)].join(" / "));
}
