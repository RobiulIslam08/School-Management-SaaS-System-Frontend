export type SectionLike = string | { name?: string; capacity?: number; classTeacherId?: string };

export function sectionNames(sections?: SectionLike[] | null): string[] {
  if (!sections?.length) return ["A"];
  return sections.map((item) => (typeof item === "string" ? item : item.name || "A")).filter(Boolean);
}

export function asSectionRows(sections?: SectionLike[] | null): Array<{ name: string; capacity: number; classTeacherId?: string }> {
  if (!sections?.length) return [{ name: "A", capacity: 0 }];
  return sections.map((item) =>
    typeof item === "string"
      ? { name: item, capacity: 0 }
      : { name: item.name || "A", capacity: item.capacity ?? 0, classTeacherId: item.classTeacherId }
  );
}
