import type { ReactNode } from "react";
import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export function SchoolLetterhead({
  settings,
  title,
  subtitle,
  children,
}: {
  settings?: SchoolSettings;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <article className="marksheet-sheet border-2 border-foreground bg-white p-6 text-foreground shadow-sm print:p-8">
      <header className="border-b-2 border-foreground pb-4 text-center">
        {settings?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt="" className="mx-auto mb-2 h-16 w-16 object-contain" />
        ) : null}
        <h1 className="text-xl font-bold uppercase tracking-wide">{settings?.name}</h1>
        {settings?.address ? <p className="mt-1 text-sm">{settings.address}</p> : null}
        <p className="mt-1 text-xs">
          {settings?.eiin ? `${t.marksheets.eiin}: ${settings.eiin}` : null}
          {settings?.establishedYear ? ` · ${settings.establishedYear}` : null}
        </p>
        {settings?.motto ? <p className="mt-1 text-xs italic">{settings.motto}</p> : null}
        <p className="mt-3 text-lg font-bold uppercase tracking-wide">{title}</p>
        {subtitle ? <p className="mt-1 text-sm">{subtitle}</p> : null}
      </header>
      {children}
    </article>
  );
}

export function SignatureRow({ lines }: { lines: string[] }) {
  return (
    <div className="mt-16 grid grid-cols-2 gap-8 text-center text-xs md:grid-cols-3">
      {lines.map((line) => (
        <div key={line}>
          <div className="mb-8 border-b border-foreground" />
          <p>{line}</p>
        </div>
      ))}
    </div>
  );
}
