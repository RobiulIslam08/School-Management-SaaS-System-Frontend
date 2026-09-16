import { redirect } from "next/navigation";

export default async function FeesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const query = await searchParams;
  const suffix = query.studentId ? `?studentId=${encodeURIComponent(query.studentId)}` : "";
  redirect(`/fees/dues${suffix}`);
}
