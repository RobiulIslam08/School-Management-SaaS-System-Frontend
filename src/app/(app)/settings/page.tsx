"use client";

import { useEffect, useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { PageHeader } from "@/components/page-header";
import { QueryError, TableSkeleton } from "@/components/query-state";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetSettingsQuery();
  const [update, { isLoading: saving }] = useUpdateSettingsMutation();
  const [tab, setTab] = useState("identity");
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({
    name: "",
    eiin: "",
    address: "",
    motto: "",
    academicYear: "2026",
    establishedYear: "",
    logoUrl: "",
    primary: "#14532d",
    smsApiKey: "",
    defaultLanguage: "bn" as "bn" | "en",
  });

  useEffect(() => {
    if (data?.data) {
      setForm({
        name: data.data.name,
        eiin: data.data.eiin,
        address: data.data.address,
        motto: data.data.motto,
        academicYear: data.data.academicYear,
        establishedYear: data.data.establishedYear ? String(data.data.establishedYear) : "",
        logoUrl: data.data.logoUrl ?? "",
        primary: data.data.theme?.primary ?? "#14532d",
        smsApiKey: data.data.smsApiKey ?? "",
        defaultLanguage: data.data.defaultLanguage ?? "bn",
      });
    }
  }, [data]);

  if (isLoading) return <TableSkeleton />;
  if (isError) return <QueryError onRetry={refetch} />;

  async function save() {
    const result = await update({
      name: form.name,
      eiin: form.eiin,
      address: form.address,
      motto: form.motto,
      academicYear: form.academicYear,
      establishedYear: form.establishedYear ? Number(form.establishedYear) : null,
      logoUrl: form.logoUrl,
      smsApiKey: form.smsApiKey,
      defaultLanguage: form.defaultLanguage,
      theme: { primary: form.primary, radius: "0.75rem" },
    });
    toastApiResult(result, t.common.save, t.common.loadError);
  }

  return (
    <div>
      <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />
      <WorkspaceTabs
        tabs={[
          { id: "identity", label: t.common.identity },
          { id: "appearance", label: t.common.appearance },
          { id: "sms", label: t.nav.sms },
        ]}
        active={tab}
        onChange={setTab}
      />
      <Card className="max-w-xl space-y-4">
        {tab === "identity" ? (
          <>
            <Field label={t.settings.schoolName}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="EIIN"><Input value={form.eiin} onChange={(e) => setForm({ ...form, eiin: e.target.value })} /></Field>
            <Field label={t.settings.address}><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label={t.settings.motto}><Input value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} /></Field>
            <Field label={t.settings.academicYear}><Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></Field>
            <Field label={t.common.established}><Input value={form.establishedYear} onChange={(e) => setForm({ ...form, establishedYear: e.target.value })} /></Field>
          </>
        ) : null}
        {tab === "appearance" ? (
          <>
            <Field label={t.settings.theme}><Input type="color" value={form.primary} onChange={(e) => setForm({ ...form, primary: e.target.value })} /></Field>
            <Field label={t.common.logo}><Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></Field>
            <Field label={t.settings.language}>
              <Select value={form.defaultLanguage} onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value as "bn" | "en" })}>
                <option value="bn">বাংলা</option>
                <option value="en">English</option>
              </Select>
            </Field>
            <p className="text-xs text-muted-foreground">{t.settings.languageHint}</p>
          </>
        ) : null}
        {tab === "sms" ? (
          <>
            <Field label={t.settings.smsKey}>
              <Input
                type={showKey ? "text" : "password"}
                value={form.smsApiKey}
                onChange={(e) => setForm({ ...form, smsApiKey: e.target.value })}
                autoComplete="off"
              />
            </Field>
            <Button type="button" variant="ghost" className="h-9 px-2" onClick={() => setShowKey((v) => !v)}>
              {showKey ? t.common.hide : t.common.show}
            </Button>
            <p className="text-xs text-muted-foreground">{t.settings.smsHint}</p>
          </>
        ) : null}
        <Button disabled={saving} type="button" onClick={save}>
          {t.common.save}
        </Button>
      </Card>
    </div>
  );
}
