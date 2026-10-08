import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input, Select } from "@/components/ui";
import { readFile, text } from "@/components/website/copy";
import { PhotoField } from "@/components/website/photo-field";
import { SectionFrame } from "@/components/website/section-frame";
import { VideoField, isVideoLink, youtubeThumb } from "@/components/website/video-field";
import type { WebsiteBundle } from "@/lib/api/websiteApi";
import { useI18n } from "@/lib/i18n";

const FILE_KINDS = [
  { key: "syllabus", bn: "সিলেবাস", en: "Syllabus", href: "/academic/syllabus" },
  { key: "routine", bn: "রুটিন", en: "Routine", href: "/academic/routine" },
  { key: "prospectus", bn: "প্রসপেক্টাস", en: "Prospectus", href: "/academic/syllabus" },
  { key: "form", bn: "ফর্ম", en: "Form", href: "/admission" },
  { key: "calendar", bn: "ক্যালেন্ডার", en: "Calendar", href: "/academic/calendar" },
] as const;

const ALBUM_KINDS = [
  { key: "campus", bn: "ক্যাম্পাস", en: "Campus" },
  { key: "cultural", bn: "সাংস্কৃতিক", en: "Cultural" },
  { key: "sports", bn: "খেলা", en: "Sports" },
  { key: "other", bn: "অন্যান্য", en: "Other" },
] as const;

export function MediaTab({
  bundle,
  savingAlbum,
  onAlbum,
  onMedia,
  onFile,
  onDeleteAlbum,
  onDeleteMedia,
  onDeleteFile,
}: {
  bundle: WebsiteBundle;
  savingAlbum: boolean;
  onAlbum: (body: Record<string, unknown>) => Promise<boolean>;
  onMedia: (body: Record<string, unknown>) => Promise<boolean>;
  onFile: (body: Record<string, unknown>) => Promise<boolean>;
  onDeleteAlbum: (id: string) => void;
  onDeleteMedia: (id: string) => void;
  onDeleteFile: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const pdf = useRef<HTMLInputElement>(null);
  const firstAlbum = bundle.albums[0];
  const [albumId, setAlbumId] = useState(text(firstAlbum?._id));
  const [titleBn, setTitleBn] = useState(text(firstAlbum?.titleBn));
  const [titleEn, setTitleEn] = useState(text(firstAlbum?.titleEn));
  const [albumKind, setAlbumKind] = useState(text(firstAlbum?.kind) || "campus");
  const [newTitle, setNewTitle] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [video, setVideo] = useState("");
  const [caption, setCaption] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [fileTitleEn, setFileTitleEn] = useState("");
  const [fileKind, setFileKind] = useState<(typeof FILE_KINDS)[number]["key"]>("syllabus");
  const selected = bundle.albums.find((item) => text(item._id) === albumId);
  const photos = bundle.media.filter((item) => text(item.kind) !== "video" && (!albumId || text(item.albumId) === albumId));
  const videos = bundle.media.filter((item) => text(item.kind) === "video");
  const fileHref = FILE_KINDS.find((kind) => kind.key === fileKind)?.href ?? "/academic/syllabus";

  function loadAlbum(id: string) {
    const row = bundle.albums.find((item) => text(item._id) === id);
    setAlbumId(id);
    setTitleBn(text(row?.titleBn));
    setTitleEn(text(row?.titleEn));
    setAlbumKind(text(row?.kind) || "campus");
  }

  return (
    <div className="space-y-4">
      <SectionFrame title={t.website.album} where={t.website.whereGallery} href={albumId ? `/gallery/${albumId}` : "/gallery"}>
        <Field label={t.website.album}>
          <Select value={albumId} onChange={(event) => loadAlbum(event.target.value)}>
            {bundle.albums.map((item) => (
              <option key={text(item._id)} value={text(item._id)}>{text(item.titleBn) || text(item.titleEn)}</option>
            ))}
          </Select>
        </Field>
        {selected ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="বাংলা"><Input value={titleBn} onChange={(event) => setTitleBn(event.target.value)} /></Field>
              <Field label="English"><Input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} /></Field>
            </div>
            <Field label={t.website.kind}>
              <Select value={albumKind} onChange={(event) => setAlbumKind(event.target.value)}>
                {ALBUM_KINDS.map((kind) => (
                  <option key={kind.key} value={kind.key}>{locale === "bn" ? kind.bn : kind.en}</option>
                ))}
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={savingAlbum}
                onClick={() => onAlbum({
                  id: albumId,
                  titleBn: titleBn.trim(),
                  titleEn: titleEn.trim(),
                  kind: albumKind,
                  status: "published",
                })}
              >
                {t.common.save}
              </Button>
              <Button type="button" variant="secondary" onClick={() => onDeleteAlbum(albumId)}>{t.common.delete}</Button>
            </div>
          </>
        ) : <p className="text-sm text-muted-foreground">{t.website.empty}</p>}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input value={newTitle} placeholder={t.website.album} onChange={(event) => setNewTitle(event.target.value)} />
          <Button
            type="button"
            variant="secondary"
            disabled={savingAlbum || !newTitle.trim()}
            onClick={async () => {
              const ok = await onAlbum({ titleBn: newTitle.trim(), titleEn: newTitle.trim(), kind: albumKind, status: "published" });
              if (ok) setNewTitle("");
            }}
          >
            {t.common.add}
          </Button>
        </div>
      </SectionFrame>

      <SectionFrame title={t.website.photo} where={t.website.whereGallery} href={albumId ? `/gallery/${albumId}` : "/gallery"}>
        <PhotoField label={t.website.photo} value={photoUrl} alt={alt} onChange={setPhotoUrl} onAlt={setAlt} />
        <Button
          type="button"
          disabled={!albumId || !photoUrl || !alt.trim()}
          onClick={async () => {
            const ok = await onMedia({ albumId, kind: "image", url: photoUrl, alt: alt.trim(), captionBn: alt.trim(), status: "published" });
            if (ok) {
              setPhotoUrl("");
              setAlt("");
            }
          }}
        >
          {t.common.add}
        </Button>
        {photos.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((item) => (
              <li key={text(item._id)} className="overflow-hidden rounded-lg border border-border">
                {text(item.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={text(item.url)} alt={text(item.alt)} className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center text-sm text-muted-foreground">{t.website.photo}</div>
                )}
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="truncate text-xs">{text(item.alt) || t.website.photo}</span>
                  <Button type="button" variant="secondary" onClick={() => onDeleteMedia(text(item._id))}>{t.website.remove}</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">{t.website.empty}</p>}
      </SectionFrame>

      <SectionFrame title={t.website.video} where={t.website.whereGallery} href="/gallery">
        <VideoField label={t.website.video} value={video} caption={caption} onChange={setVideo} onCaption={setCaption} />
        <Button
          type="button"
          disabled={!albumId || !video.trim() || !isVideoLink(video)}
          onClick={async () => {
            if (!isVideoLink(video)) {
              toast.error(t.website.videoBad);
              return;
            }
            const ok = await onMedia({
              albumId,
              kind: "video",
              videoUrl: video.trim(),
              alt: caption.trim() || "Video",
              captionBn: caption.trim(),
              status: "published",
            });
            if (ok) {
              setVideo("");
              setCaption("");
            }
          }}
        >
          {t.common.add}
        </Button>
        {videos.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {videos.map((item) => {
              const url = text(item.videoUrl);
              const thumb = youtubeThumb(url);
              return (
                <li key={text(item._id)} className="overflow-hidden rounded-lg border border-border">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="grid aspect-video place-items-center bg-muted text-sm">Facebook</div>
                  )}
                  <div className="flex items-center justify-between gap-2 p-3">
                    <a className="truncate text-sm text-primary underline" href={url} target="_blank" rel="noreferrer">
                      {text(item.captionBn) || text(item.alt) || t.website.video}
                    </a>
                    <Button type="button" variant="secondary" onClick={() => onDeleteMedia(text(item._id))}>{t.website.remove}</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted-foreground">{t.website.empty}</p>}
      </SectionFrame>

      <SectionFrame title={t.website.file} where={t.website.whereFiles} href={fileHref}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="বাংলা"><Input value={fileTitle} onChange={(event) => setFileTitle(event.target.value)} /></Field>
          <Field label="English"><Input value={fileTitleEn} onChange={(event) => setFileTitleEn(event.target.value)} /></Field>
        </div>
        <Field label={t.website.fileKind}>
          <Select value={fileKind} onChange={(event) => setFileKind(event.target.value as typeof fileKind)}>
            {FILE_KINDS.map((kind) => (
              <option key={kind.key} value={kind.key}>{locale === "bn" ? kind.bn : kind.en}</option>
            ))}
          </Select>
        </Field>
        <input
          ref={pdf}
          aria-label={t.website.file}
          className="sr-only"
          type="file"
          accept="application/pdf"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (file.size > 8 * 1024 * 1024) {
              toast.error(t.website.pdfTooBig);
              return;
            }
            const ok = await onFile({
              kind: fileKind,
              titleBn: fileTitle.trim() || file.name,
              titleEn: fileTitleEn.trim(),
              filename: file.name,
              dataUrl: await readFile(file),
              status: "published",
            });
            if (ok) {
              setFileTitle("");
              setFileTitleEn("");
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={() => pdf.current?.click()}>{t.website.file}</Button>
        <p className="text-xs text-muted-foreground">{t.website.pdfTooBig}</p>
        {bundle.files.length ? (
          <ul className="divide-y divide-border text-sm">
            {bundle.files.map((item) => (
              <li key={text(item._id)} className="flex items-center justify-between gap-2 py-2">
                <span>{text(item.titleBn) || text(item.filename)} · {text(item.kind)}</span>
                <Button type="button" variant="secondary" onClick={() => onDeleteFile(text(item._id))}>{t.website.remove}</Button>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">{t.website.empty}</p>}
      </SectionFrame>
    </div>
  );
}
