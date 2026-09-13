"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { toastApiResult } from "@/lib/toast-api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState, QueryError, TableSkeleton } from "@/components/query-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, Card, Field, Select, Textarea } from "@/components/ui";
import { useGetClassesQuery, useGetSmsQuery, useSendSmsMutation } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type SmsRow = { _id: string; to: string; body: string; status: string; audience?: string; createdAt?: string };

function smsTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "sent") return "success";
  if (status === "failed") return "danger";
  if (status === "queued") return "warning";
  return "neutral";
}

export default function SmsPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetSmsQuery();
  const { data: classes } = useGetClassesQuery();
  const [sendSms, { isLoading: sending }] = useSendSmsMutation();
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all_guardians");
  const [classId, setClassId] = useState("");
  const rows = (data?.data ?? []) as SmsRow[];
  const classList = (classes?.data ?? []) as Array<{ _id: string; name: string }>;

  function statusLabel(status: string) {
    if (status === "sent") return t.common.sent;
    if (status === "failed") return t.common.failed;
    return t.common.queued;
  }

  return (
    <div>
      <PageHeader title={t.sms.title} subtitle={t.sms.subtitle} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.sms.history} value={rows.length} icon={<MessageSquare size={18} />} />
        <StatCard label={t.common.queued} value={rows.filter((row) => row.status === "queued").length} tone="warning" />
        <StatCard label={t.common.sent} value={rows.filter((row) => row.status === "sent").length} tone="success" />
      </div>
      <Card className="mb-6 max-w-2xl space-y-3">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await sendSms({ body, audience, classId: audience === "class" ? classId : undefined });
            if (toastApiResult(result, t.sms.send, t.common.loadError)) setBody("");
          }}
        >
          <Field label={t.common.audience}>
            <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="all_guardians">{t.sms.allGuardians}</option>
              <option value="class">{t.sms.classAudience}</option>
              <option value="teachers">{t.sms.teachersAudience}</option>
            </Select>
          </Field>
          {audience === "class" ? (
            <Field label={t.common.class}>
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">{t.common.class}</option>
                {classList.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Field label={t.sms.message}>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <p className="text-xs text-muted-foreground">
            {body.length} {t.common.characters} · {t.sms.sendHint}
          </p>
          <Button disabled={sending || body.trim().length < 3 || (audience === "class" && !classId)} type="submit">
            {t.sms.send}
          </Button>
        </form>
      </Card>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <QueryError onRetry={refetch} /> : null}
      {!isLoading && !rows.length ? <EmptyState title={t.sms.empty} hint={t.sms.emptyHint} /> : null}
      <DataTable
        searchable
        pageSize={12}
        rows={rows}
        rowKey={(row) => row._id}
        columns={[
          { header: t.sms.recipient, cell: (row) => row.to, sortValue: (row) => row.to },
          { header: t.sms.message, cell: (row) => row.body },
          {
            header: t.common.status,
            cell: (row) => <StatusBadge label={statusLabel(row.status)} tone={smsTone(row.status)} />,
            sortValue: (row) => row.status,
          },
        ]}
      />
    </div>
  );
}
