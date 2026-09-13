"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, LogOut } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useLogoutMutation, useMeQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LanguageSwitch } from "./language-switch";
import { NAV_GROUPS } from "./nav";
import { Button, Input } from "./ui";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useMeQuery();
  const [logout] = useLogoutMutation();
  const [open, setOpen] = useState(false);

  const session = data?.data;
  const features = session?.features ?? {};
  const authed = Boolean(session) && !isError;
  const primary = session?.settings?.theme?.primary ?? "#14532d";

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.feature || features[item.feature]),
      })).filter((group) => group.items.length),
    [features]
  );

  return (
    <div className="relative min-h-screen bg-canvas" style={{ ["--primary" as string]: primary }}>
      {isLoading ? (
        <div className="grid min-h-screen grid-cols-[16rem_1fr] no-print">
          <div className="animate-pulse bg-sidebar" />
          <div className="p-8">
            <div className="mb-6 h-10 w-64 animate-pulse rounded bg-muted" />
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ) : null}

      {!isLoading && !authed ? (
        <div className="flex min-h-screen items-center justify-center p-6 no-print">
          <div className="max-w-md rounded-xl border bg-white p-8 text-center">
            <h1 className="text-xl font-semibold">{t.common.noSession}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.common.noSessionHint}</p>
            <Button className="mt-4" onClick={() => router.push("/login")}>
              {t.common.signIn}
            </Button>
            <Button className="mt-2" variant="ghost" onClick={() => refetch()}>
              {t.common.retry}
            </Button>
          </div>
        </div>
      ) : null}

      <div className={cn("flex min-h-screen", (!authed || isLoading) && "hidden")}>
        <aside
          className={cn(
            "no-print fixed inset-y-0 z-40 w-72 overflow-y-auto border-r border-border bg-sidebar p-4 transition md:static md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="mb-6 px-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.auth.school}</p>
            <h2 className="text-lg font-semibold leading-tight">{session?.settings?.name ?? "School"}</h2>
            <p className="text-xs text-muted-foreground">{session?.settings?.academicYear}</p>
          </div>
          <nav className="space-y-4">
            {groups.map((group) => (
              <div key={group.titleKey}>
                <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.nav[group.titleKey]}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm hover:bg-muted",
                        pathname === item.href && "bg-primary/10 font-medium text-primary"
                      )}
                    >
                      {t.nav[item.labelKey]}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur">
            <Button variant="ghost" className="md:hidden" aria-label={t.common.menu} onClick={() => setOpen((v) => !v)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t.common.searchPlaceholder}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const value = (event.target as HTMLInputElement).value;
                    router.push(`/students?q=${encodeURIComponent(value)}`);
                  }
                }}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitch />
              <div className="hidden text-right text-sm sm:block">
                <p className="font-medium">{session?.user.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{session?.user.role?.replaceAll("_", " ")}</p>
              </div>
              <Button
                variant="secondary"
                aria-label={t.common.signOut}
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
