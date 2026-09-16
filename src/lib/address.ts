export type StudentAddress = {
  division?: string;
  district?: string;
  upazila?: string;
  area?: string;
  road?: string;
  holding?: string;
  block?: string;
};

export function formatStudentAddress(address?: StudentAddress | null): string {
  if (!address) return "";
  const line = [
    address.holding,
    address.block,
    address.road,
    address.area,
    address.upazila,
    address.district,
    address.division,
  ].filter((part) => Boolean(part && part.trim()));
  return line.join(", ");
}
