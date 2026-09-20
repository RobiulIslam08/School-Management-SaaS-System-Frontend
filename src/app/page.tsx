"use client";

import Link from "next/link";
import { useGetBrandingQuery, useGetPublicNoticesQuery } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";

type PublicNotice = {
  _id: string;
  title: string;
  issueDate?: string;
  createdAt?: string;
  pinned?: boolean;
};

export default function HomePage() {
  const { t, locale } = useI18n();
  const { data: brandingData } = useGetBrandingQuery();
  const { data: noticesData } = useGetPublicNoticesQuery();
  const schoolName = String(brandingData?.data?.name ?? "School Management OS");
  const notices = ((noticesData?.data ?? []) as PublicNotice[]).slice(0, 5);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{schoolName}</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
          এক স্কুল, এক ডাটাবেজ, সম্পূর্ণ আলাদা অপারেশন।
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          ভর্তি থেকে ফলাফল, ফি থেকে হাজিরা — বাংলাদেশি স্কুলের জন্য প্রিমিয়াম ড্যাশবোর্ড।
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
            href="/login"
          >
            স্কুল লগইন
          </Link>
          <Link
            className="inline-flex h-11 items-center rounded-md border border-border bg-white px-5 text-sm font-medium"
            href="/apply"
          >
            অনলাইন ভর্তি আবেদন
          </Link>
          <Link
            className="inline-flex h-11 items-center rounded-md border border-border bg-white px-5 text-sm font-medium"
            href="/notice-board"
          >
            {t.notices.boardTitle}
          </Link>
        </div>
      </div>

      <section className="border-t border-border bg-white/60">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{t.notices.landingTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.notices.landingHint}</p>
            </div>
            <Link href="/notice-board" className="text-sm font-medium text-primary hover:underline">
              {t.notices.boardMore}
            </Link>
          </div>
          {notices.length ? (
            <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-white">
              {notices.map((item) => (
                <li key={item._id}>
                  <Link
                    href="/notice-board"
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-muted/40"
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.issueDate || item.createdAt || Date.now()).toLocaleDateString(
                        locale === "bn" ? "bn-BD" : "en-GB"
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">{t.notices.boardEmpty}</p>
          )}
        </div>
      </section>
    </div>
  );
}
