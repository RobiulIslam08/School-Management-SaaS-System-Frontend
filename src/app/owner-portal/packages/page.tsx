"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { toastApiResult } from "@/lib/toast-api";
import { useGetPackagesQuery, useMeQuery, useSetup2faMutation, useUpdatePackagesMutation } from "@/lib/api/schoolApi";
import { Button } from "@/components/ui";
import { LanguageSwitch } from "@/components/language-switch";
import { QueryError, TableSkeleton } from "@/components/query-state";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function OwnerPackagesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const session = useMeQuery();
  const { data, isLoading, isError, refetch } = useGetPackagesQuery();
  const [update, { isLoading: saving }] = useUpdatePackagesMutation();
  const [setup2fa] = useSetup2faMutation();
  const [modules, setModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (session.data && session.data.data.user.role !== "platform_owner") {
      router.replace("/dashboard");
    }
  }, [session.data, router]);

  useEffect(() => {
    if (data?.data.modules) setModules(data.data.modules);
  }, [data]);

  if (isLoading) return <div className="p-8"><TableSkeleton /></div>;
  if (isError) return <div className="p-8"><QueryError onRetry={refetch} /></div>;

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <div className="mb-4 flex justify-end">
        <LanguageSwitch />
      </div>
      <h1 className="text-2xl font-semibold">{t.owner.packages}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.owner.packagesHint}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Object.entries(data?.data.labels ?? {}).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={Boolean(modules[key])}
              onChange={(event) => setModules((prev) => ({ ...prev, [key]: event.target.checked }))}
            />
          </label>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          disabled={saving}
          onClick={async () => {
            const result = await update({ modules });
            toastApiResult(result, t.owner.save, t.common.loadError);
          }}
        >
          {t.owner.save}
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const result = await setup2fa();
            if ("data" in result && result.data) toast.success(`2FA secret: ${result.data.data.secret}`);
          }}
        >
          {t.owner.enable2fa}
        </Button>
      </div>
    </div>
  );
}
