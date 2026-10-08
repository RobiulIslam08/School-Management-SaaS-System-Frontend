"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialog";
import { PageHeader } from "@/components/page-header";
import { QueryError, TableSkeleton } from "@/components/query-state";
import { AcademicBoard } from "@/components/website/academic-board";
import { asPage, configPayload, lines, pagePath, text, type PageRow } from "@/components/website/copy";
import { HomeTab } from "@/components/website/home-tab";
import { InquiriesTab, NewsTab } from "@/components/website/news-tab";
import { MediaTab } from "@/components/website/media-tab";
import { MenuTab } from "@/components/website/menu-tab";
import { PagesTab } from "@/components/website/pages-tab";
import { PeopleTab } from "@/components/website/people-tab";
import { ReadyTab } from "@/components/website/ready-tab";
import { SectionFrame, sectionUrl } from "@/components/website/section-frame";
import { isVideoLink } from "@/components/website/video-field";
import { cn } from "@/lib/utils";
import { useGetSettingsQuery } from "@/lib/api/schoolApi";
import {
  useDeleteWebsiteAlbumMutation,
  useDeleteWebsiteFileMutation,
  useDeleteWebsiteMediaMutation,
  useDeleteWebsitePersonMutation,
  useDeleteWebsitePostMutation,
  useGetWebsiteQuery,
  useMarkWebsiteInquiryMutation,
  useSaveWebsiteAlbumMutation,
  useSaveWebsiteConfigMutation,
  useSaveWebsiteFileMutation,
  useSaveWebsiteMediaMutation,
  useSaveWebsitePageMutation,
  useSaveWebsitePersonMutation,
  useSaveWebsitePostMutation,
} from "@/lib/api/websiteApi";
import { useI18n } from "@/lib/i18n";
import { toastApiResult } from "@/lib/toast-api";

const SECTIONS = [
  { id: "ready", href: "/contact" },
  { id: "menu", href: "/" },
  { id: "home", href: "/" },
  { id: "pages", href: "/about" },
  { id: "people", href: "/office/principal" },
  { id: "media", href: "/gallery" },
  { id: "news", href: "/news" },
  { id: "inquiries", href: "" },
  { id: "academic", href: "/academic/routine" },
] as const;

function cleanBlocks(page: PageRow) {
  return page.blocks.map((block) => (
    block.type === "list"
      ? { ...block, itemsBn: lines((block.itemsBn ?? []).join("\n")), itemsEn: lines((block.itemsEn ?? []).join("\n")) }
      : block
  ));
}

export function WebsiteWorkspace() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useGetWebsiteQuery();
  const { data: settings } = useGetSettingsQuery();
  const [saveConfig, { isLoading: saving }] = useSaveWebsiteConfigMutation();
  const [savePage, { isLoading: savingPage }] = useSaveWebsitePageMutation();
  const [savePost, { isLoading: savingPost }] = useSaveWebsitePostMutation();
  const [deletePost] = useDeleteWebsitePostMutation();
  const [saveAlbum, { isLoading: savingAlbum }] = useSaveWebsiteAlbumMutation();
  const [deleteAlbum] = useDeleteWebsiteAlbumMutation();
  const [saveMedia] = useSaveWebsiteMediaMutation();
  const [deleteMedia] = useDeleteWebsiteMediaMutation();
  const [savePerson, { isLoading: savingPerson }] = useSaveWebsitePersonMutation();
  const [deletePerson] = useDeleteWebsitePersonMutation();
  const [saveFile] = useSaveWebsiteFileMutation();
  const [deleteFile] = useDeleteWebsiteFileMutation();
  const [markInquiry] = useMarkWebsiteInquiryMutation();
  const [tab, setTab] = useState("ready");
  const [form, setFormState] = useState<Record<string, unknown>>({});
  const [configDirty, setConfigDirty] = useState(false);
  const [pageId, setPageId] = useState("");
  const [pageForm, setPageForm] = useState<PageRow | null>(null);
  const [pageDirty, setPageDirty] = useState(false);
  const [pending, setPending] = useState<null | (() => Promise<unknown>)>(null);
  const [deleting, setDeleting] = useState(false);

  const bundle = data?.data;

  useEffect(() => {
    if (!bundle?.config || configDirty) return;
    setFormState(bundle.config);
  }, [bundle, configDirty]);

  useEffect(() => {
    if (!bundle) return;
    if (!pageId) {
      const first = bundle.pages[0];
      if (!first) return;
      setPageId(String(first._id));
      setPageForm(asPage(first));
      return;
    }
    if (pageDirty) return;
    const row = bundle.pages.find((item) => String(item._id) === pageId);
    if (row) setPageForm(asPage(row));
  }, [bundle, pageId, pageDirty]);

  function setForm(next: Record<string, unknown>) {
    setConfigDirty(true);
    setFormState(next);
  }

  async function onSaveConfig() {
    if (!isVideoLink(text(form.heroVideoUrl))) {
      toast.error(t.website.videoBad);
      return;
    }
    const result = await saveConfig(configPayload(form));
    if (toastApiResult(result, t.common.save, t.common.loadError)) setConfigDirty(false);
  }

  async function onSavePage() {
    if (!pageForm) return;
    const result = await savePage({ id: pageForm._id, ...pageForm, blocks: cleanBlocks(pageForm) });
    if (toastApiResult(result, t.common.save, t.common.loadError)) setPageDirty(false);
  }

  function askDelete(run: () => Promise<unknown>) {
    setPending(() => run);
  }

  if (isLoading) return <TableSkeleton />;
  if (isError || !bundle) return <QueryError onRetry={refetch} />;

  const labels: Record<string, string> = {
    ready: t.website.ready,
    menu: t.website.menu,
    home: t.website.home,
    pages: t.website.pages,
    people: t.website.people,
    media: t.website.gallery,
    news: t.website.news,
    inquiries: t.website.inquiries,
    academic: t.website.academic,
  };
  const active = SECTIONS.find((item) => item.id === tab) ?? SECTIONS[0];
  const viewHref = tab === "pages" && pageForm ? pagePath(pageForm) : active.href;

  return (
    <div>
      <PageHeader
        title={t.website.title}
        subtitle={t.website.subtitle}
        action={
          viewHref ? (
            <a className="inline-flex h-11 items-center rounded-md border border-border bg-white px-4 text-sm font-medium" href={sectionUrl(viewHref)} target="_blank" rel="noreferrer">
              {t.website.openSite}
            </a>
          ) : null
        }
      />
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={t.website.title}>
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "min-h-11 shrink-0 rounded-md px-3 py-2 text-left text-sm",
                tab === item.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              )}
              onClick={() => setTab(item.id)}
            >
              {labels[item.id]}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
      {tab === "ready" ? (
        <ReadyTab form={form} setForm={setForm} settingsOk={Boolean(settings?.data?.logoUrl)} saving={saving} onSave={onSaveConfig} />
      ) : null}
      {tab === "menu" ? <MenuTab form={form} setForm={setForm} saving={saving} onSave={onSaveConfig} /> : null}
      {tab === "home" ? <HomeTab form={form} setForm={setForm} saving={saving} onSave={onSaveConfig} /> : null}
      {tab === "pages" ? (
        <PagesTab
          pages={bundle.pages.map((item) => asPage(item))}
          page={pageForm}
          saving={savingPage}
          onPick={(id) => {
            const row = bundle.pages.find((item) => String(item._id) === id);
            setPageDirty(false);
            setPageId(id);
            if (row) setPageForm(asPage(row));
          }}
          onChange={(next) => {
            setPageDirty(true);
            setPageForm(next);
          }}
          onSave={onSavePage}
        />
      ) : null}
      {tab === "people" ? (
        <PeopleTab
          bundle={bundle}
          form={form}
          setForm={setForm}
          saving={saving}
          savingPerson={savingPerson}
          onSaveConfig={onSaveConfig}
          onSavePerson={async (body) => {
            const result = await savePerson(body);
            return toastApiResult(result, t.common.save, t.common.loadError);
          }}
          onDelete={(id) => askDelete(() => deletePerson(id))}
        />
      ) : null}
      {tab === "media" ? (
        <MediaTab
          bundle={bundle}
          savingAlbum={savingAlbum}
          onAlbum={async (body) => {
            const result = await saveAlbum(body);
            return toastApiResult(result, t.common.save, t.common.loadError);
          }}
          onMedia={async (body) => {
            const result = await saveMedia(body);
            return toastApiResult(result, t.common.save, t.common.loadError);
          }}
          onFile={async (body) => {
            const result = await saveFile(body);
            return toastApiResult(result, t.common.save, t.common.loadError);
          }}
          onDeleteAlbum={(id) => askDelete(() => deleteAlbum(id))}
          onDeleteMedia={(id) => askDelete(() => deleteMedia(id))}
          onDeleteFile={(id) => askDelete(() => deleteFile(id))}
        />
      ) : null}
      {tab === "news" ? (
        <NewsTab
          bundle={bundle}
          saving={savingPost}
          onSave={async (body) => {
            const result = await savePost(body);
            return toastApiResult(result, t.common.save, t.common.loadError);
          }}
          onDelete={(id) => askDelete(() => deletePost(id))}
        />
      ) : null}
      {tab === "inquiries" ? (
        <InquiriesTab
          bundle={bundle}
          onRead={async (id) => {
            const result = await markInquiry(id);
            return toastApiResult(result, t.website.markRead, t.common.loadError);
          }}
        />
      ) : null}
      {tab === "academic" ? (
        <SectionFrame title={t.website.academic} where={t.website.whereAcademic} href="/academic/routine">
          <AcademicBoard />
        </SectionFrame>
      ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(pending)}
        title={t.common.delete}
        message={t.website.confirmDelete}
        busy={deleting}
        onClose={() => { if (!deleting) setPending(null); }}
        onConfirm={async () => {
          if (!pending) return;
          setDeleting(true);
          const result = await pending();
          setDeleting(false);
          toastApiResult(result as Parameters<typeof toastApiResult>[0], t.common.delete, t.common.loadError);
          setPending(null);
        }}
      />
    </div>
  );
}
