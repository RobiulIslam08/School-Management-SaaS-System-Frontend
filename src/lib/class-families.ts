export type ClassRow = {
  _id: string;
  name: string;
  level?: number;
  group?: string;
  sections?: unknown;
};

const GROUP_SUFFIX = /\s+(Science|Business|Humanities)$/i;

export function classFamilyLabel(name: string): string {
  return name.replace(GROUP_SUFFIX, "").trim();
}

export function classFamilies(classes: ClassRow[]): Array<{ label: string; members: ClassRow[]; groups: string[] }> {
  const map = new Map<string, ClassRow[]>();
  for (const item of classes) {
    const label = classFamilyLabel(item.name);
    const list = map.get(label) ?? [];
    list.push(item);
    map.set(label, list);
  }
  return [...map.entries()].map(([label, members]) => ({
    label,
    members,
    groups: [...new Set(members.map((item) => item.group).filter((group) => group && group !== "None"))] as string[],
  }));
}

export function resolveClassMember(classes: ClassRow[], familyLabel: string, group: string): ClassRow | undefined {
  const family = classFamilies(classes).find((item) => item.label === familyLabel);
  if (!family?.members.length) return undefined;
  if (family.members.length === 1) return family.members[0];
  return family.members.find((item) => (item.group ?? "None") === group) ?? family.members[0];
}
