"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap, Users, School, Percent, Wallet, Banknote, CalendarDays, Bell } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { QueryError, TableSkeleton, EmptyState } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui";
import { useGetDashboardQuery, useMeQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type DashboardData = {
  students: number;
  teachers: number;
  classes: number;
  attendancePct: number;
  due: number;
  collectedMonth: number;
  upcomingExams: number;
  pendingNotices: number;
  trends?: { students: number; collected: number; attendance: number };
  attendanceSeries?: Array<{ date: string; pct: number }>;
  feeSeries?: Array<{ month: string; amount: number }>;
  classDistribution?: Array<{ name: string; count: number }>;
  activity?: Array<{ type: string; title: string; at: string; href: string }>;
  upcoming?: Array<{ title: string; at: string; href: string }>;
  topPerformers?: Array<{ id: string; name: string; gpa: number; studentId: string }>;
};

function trendLabel(vs: string, value?: number) {
  if (value == null) return undefined;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}% ${vs}`;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: session } = useMeQuery();
  const { data, isLoading, isError, refetch } = useGetDashboardQuery();
  const stats = data?.data as DashboardData | undefined;

  return (
    <div>
      <PageHeader
        title={`${t.dashboard.welcome}, ${session?.data.user.name ?? ""}`}
        subtitle={`${session?.data.settings?.name ?? ""} · ${session?.data.settings?.academicYear ?? ""}`}
      />
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {stats ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard href="/students" label={t.dashboard.students} value={stats.students ?? 0} icon={<Users size={18} />} trend={trendLabel(t.dashboard.vsLastMonth, stats.trends?.students)} />
            <StatCard href="/teachers" label={t.dashboard.teachers} value={stats.teachers ?? 0} icon={<GraduationCap size={18} />} />
            <StatCard href="/classes" label={t.dashboard.classes} value={stats.classes ?? 0} icon={<School size={18} />} />
            <StatCard href="/attendance" label={t.dashboard.attendancePct} value={`${stats.attendancePct ?? 0}%`} icon={<Percent size={18} />} trend={trendLabel(t.dashboard.vsLastMonth, stats.trends?.attendance)} tone="success" />
            <StatCard href="/fees/dues" label={t.dashboard.due} value={stats.due ?? 0} icon={<Wallet size={18} />} tone="danger" />
            <StatCard href="/fees/collected" label={t.dashboard.collected} value={stats.collectedMonth ?? 0} icon={<Banknote size={18} />} trend={trendLabel(t.dashboard.vsLastMonth, stats.trends?.collected)} />
            <StatCard href="/exams" label={t.dashboard.upcomingExams} value={stats.upcomingExams ?? 0} icon={<CalendarDays size={18} />} />
            <StatCard href="/notices" label={t.dashboard.notices} value={stats.pendingNotices ?? 0} icon={<Bell size={18} />} tone="warning" />
          </div>

          <section>
            <h2 className="mb-3 text-lg font-medium">{t.dashboard.quickActions}</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/attendance"><Button>{t.dashboard.takeAttendance}</Button></Link>
              <Link href="/students/admit"><Button variant="secondary">{t.dashboard.addStudent}</Button></Link>
              <Link href="/results"><Button variant="secondary">{t.dashboard.enterResult}</Button></Link>
              <Link href="/notices"><Button variant="secondary">{t.dashboard.sendNotice}</Button></Link>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">{t.dashboard.charts}</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard title={t.dashboard.attendanceTrend}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.attendanceSeries ?? []}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 100]} width={28} />
                    <Tooltip />
                    <Line type="monotone" dataKey="pct" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={t.dashboard.feeTrend}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.feeSeries ?? []}>
                    <XAxis dataKey="month" />
                    <YAxis width={36} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="var(--primary)" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={t.dashboard.classDist}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.classDistribution ?? []}>
                    <XAxis dataKey="name" />
                    <YAxis width={28} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Feed title={t.dashboard.activity} items={(stats.activity ?? []).map((item) => ({ ...item, meta: new Date(item.at).toLocaleString() }))} />
            <Feed title={t.dashboard.upcoming} items={(stats.upcoming ?? []).map((item) => ({ ...item, meta: new Date(item.at).toLocaleDateString() }))} />
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-lg font-medium">{t.dashboard.topPerformers}</h3>
              <ul className="mt-3 space-y-2">
                {(stats.topPerformers ?? []).map((row) => (
                  <li key={row.id}>
                    <Link href={`/students/${row.id}`} className="flex justify-between text-sm hover:text-primary">
                      <span>{row.name}</span>
                      <span className="tabular-nums text-muted-foreground">{row.gpa}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : !isLoading && !isError ? (
        <EmptyState title={t.dashboard.empty} hint={t.dashboard.emptyHint} />
      ) : null}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Feed({ title, items }: { title: string; items: Array<{ title: string; href: string; meta: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-medium">{title}</h3>
      <ul className="mt-3 space-y-3">
        {items.map((item, index) => (
          <li key={`${item.href}-${index}`}>
            <Link href={item.href} className="block text-sm hover:text-primary">
              {item.title}
              <span className="block text-xs text-muted-foreground">{item.meta}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
