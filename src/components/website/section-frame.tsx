import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

const SITE = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3001";

export function SectionFrame({
  title,
  where,
  href,
  children,
}: {
  title: string;
  where: string;
  href?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.website.showsOn}: {where}
          </p>
        </div>
        {href ? (
          <a className="text-sm font-medium text-primary underline" href={`${SITE}${href}`} target="_blank" rel="noreferrer">
            {t.website.viewThere}
          </a>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

export function sectionUrl(href: string): string {
  return `${SITE}${href}`;
}
