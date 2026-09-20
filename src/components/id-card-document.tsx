"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { SchoolSettings } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export type IdCardStudent = {
  _id: string;
  name: string;
  studentId: string;
  rollNo?: string;
  classId?: { name?: string };
  section?: string;
  photoUrl?: string;
  dob?: string;
  bloodGroup?: string;
};

function useQrDataUrl(payload: string) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: 160,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((data) => {
        if (!cancelled) setUrl(data);
      })
      .catch(() => {
        if (!cancelled) setUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);
  return url;
}

export function IdCardDocument({
  student,
  settings,
}: {
  student: IdCardStudent;
  settings?: Partial<SchoolSettings> | null;
}) {
  const { t, locale } = useI18n();
  const schoolName = settings?.name?.trim() || "School";
  const logoUrl = settings?.logoUrl?.trim() || "";
  const primary = settings?.theme?.primary || "#0b3d6e";
  const qrPayload = [
    `SID:${student.studentId}`,
    `NAME:${student.name}`,
    `SCHOOL:${schoolName}`,
    settings?.eiin ? `EIIN:${settings.eiin}` : "",
  ]
    .filter(Boolean)
    .join("|");
  const qrUrl = useQrDataUrl(qrPayload);
  const dob = student.dob
    ? new Date(student.dob).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB")
    : "—";
  const classLine = [student.classId?.name, student.section, student.rollNo ? `${t.marksheets.roll} ${student.rollNo}` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="id-card-pair flex flex-col gap-3 sm:flex-row sm:gap-4 print:break-inside-avoid">
      {/* FRONT */}
      <article
        className="id-card-sheet id-card-front relative overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
        style={{ width: "85.6mm", height: "54mm", ["--id-primary" as string]: primary }}
      >
        <div className="absolute inset-0" style={{ background: `linear-gradient(145deg, ${primary} 0%, ${primary}ee 42%, #f8fafc 42.2%)` }} />
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15" />
        <div className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/10" />

        <div className="relative z-10 flex h-full flex-col px-2.5 py-2 text-[9px] leading-tight text-slate-900">
          <div className="flex items-center justify-between gap-2 text-[7px] font-semibold uppercase tracking-[0.12em] text-white">
            <span className="truncate">
              {settings?.eiin ? `EIIN ${settings.eiin}` : t.idCards.studentCard}
            </span>
            <span className="shrink-0">{settings?.academicYear || ""}</span>
          </div>

          <div className="mt-1.5 flex items-start gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
              ) : (
                <span className="text-sm font-bold" style={{ color: primary }}>
                  {schoolName.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate text-[10px] font-bold uppercase leading-snug tracking-wide text-white">{schoolName}</p>
              {settings?.address ? (
                <p className="mt-0.5 line-clamp-1 text-[7px] text-white/85">{settings.address}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-2 flex flex-1 gap-2.5">
            <div className="flex h-[28mm] w-[22mm] shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-white bg-slate-100 shadow-sm">
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold" style={{ color: primary }}>
                  {student.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 rounded-lg bg-white/95 p-2 shadow-sm">
              <p className="text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>
                {t.idCards.studentCard}
              </p>
              <div className="mt-1 h-px w-10" style={{ background: primary }} />
              <dl className="mt-1.5 space-y-0.5 text-[8.5px]">
                <div className="flex gap-1">
                  <dt className="w-[18mm] shrink-0 text-slate-500">{t.idCards.studentId}</dt>
                  <dd className="min-w-0 font-semibold">{student.studentId}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="w-[18mm] shrink-0 text-slate-500">{t.common.name}</dt>
                  <dd className="min-w-0 font-bold uppercase leading-snug">{student.name}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="w-[18mm] shrink-0 text-slate-500">{t.common.class}</dt>
                  <dd className="min-w-0 font-medium leading-snug">{classLine || "—"}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="w-[18mm] shrink-0 text-slate-500">{t.idCards.dob}</dt>
                  <dd className="font-medium">{dob}</dd>
                </div>
              </dl>
              <div className="mt-2 flex justify-end">
                <div className="w-[22mm] text-center">
                  <div className="mb-0.5 border-b border-slate-400" />
                  <p className="text-[7px] font-medium text-slate-500">{t.idCards.authority}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* BACK */}
      <article
        className="id-card-sheet id-card-back relative flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
        style={{ width: "85.6mm", height: "54mm", ["--id-primary" as string]: primary }}
      >
        <div
          className="flex h-[9mm] shrink-0 items-center px-3"
          style={{ background: primary }}
        >
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white">{t.idCards.termsTitle}</p>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col px-3 pb-1 pt-2.5">
          <div className="pointer-events-none absolute -right-4 top-1 h-14 w-14 rounded-full bg-slate-100/90" aria-hidden />
          <ol className="relative z-[1] list-decimal space-y-1 pl-3.5 text-[7.5px] leading-[1.35] text-slate-700">
            <li>{t.idCards.term1.replace("{school}", schoolName)}</li>
            <li>{t.idCards.term2}</li>
            <li>{t.idCards.term3}</li>
          </ol>

          <div className="relative z-[1] mt-auto flex flex-col items-center pb-1 pt-1.5">
            <div className="flex h-[18mm] w-[18mm] items-center justify-center rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[7px] text-slate-400">QR</span>
              )}
            </div>
            <p className="mt-0.5 text-[6.5px] font-semibold uppercase tracking-wider text-slate-500">
              {t.idCards.scanQr}
            </p>
          </div>
        </div>

        <div
          className="flex h-[11mm] shrink-0 flex-col items-center justify-center px-3 text-center text-white"
          style={{ background: `linear-gradient(90deg, ${primary}, ${primary}cc)` }}
        >
          <p className="text-[7.5px] font-bold uppercase leading-tight tracking-wide">{schoolName}</p>
          {settings?.address ? (
            <p className="mt-0.5 line-clamp-1 text-[6.5px] text-white/90">{settings.address}</p>
          ) : null}
        </div>
      </article>
    </div>
  );
}
