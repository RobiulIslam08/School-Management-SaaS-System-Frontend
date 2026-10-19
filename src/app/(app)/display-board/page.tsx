"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  useGetPublicNoticesQuery,
  useGetRoutinesQuery,
  useGetCalendarEventsQuery,
  useMeQuery,
} from "@/lib/api/schoolApi";

interface PeriodSchedule {
  period: number;
  label: string;
  labelBn: string;
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  isBreak?: boolean;
}

const PERIOD_SCHEDULE: PeriodSchedule[] = [
  { period: 1, label: "Period 1", labelBn: "১ম পিরিয়ড", startH: 9, startM: 0, endH: 9, endM: 45 },
  { period: 2, label: "Period 2", labelBn: "২য় পিরিয়ড", startH: 9, startM: 45, endH: 10, endM: 30 },
  { period: 3, label: "Period 3", labelBn: "৩য় পিরিয়ড", startH: 10, startM: 30, endH: 11, endM: 15 },
  { period: 0, label: "Tiffin Break", labelBn: "টিফিন বিরতি", startH: 11, startM: 15, endH: 11, endM: 45, isBreak: true },
  { period: 4, label: "Period 4", labelBn: "৪র্থ পিরিয়ড", startH: 11, startM: 45, endH: 12, endM: 30 },
  { period: 5, label: "Period 5", labelBn: "৫ম পিরিয়ড", startH: 12, startM: 30, endH: 13, endM: 15 },
  { period: 6, label: "Period 6", labelBn: "৬ষ্ঠ পিরিয়ড", startH: 13, startM: 15, endH: 14, endM: 0 },
];

export default function DisplayBoardPage() {
  const { data: session } = useMeQuery();
  const [time, setTime] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [dateStrBn, setDateStrBn] = useState<string>("");
  const [dayName, setDayName] = useState<string>("");
  const [dayIdx, setDayIdx] = useState<number>(new Date().getDay());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chimeEnabled, setChimeEnabled] = useState(true);

  // Period Radar
  const [currentPeriod, setCurrentPeriod] = useState<PeriodSchedule | null>(null);
  const [nextPeriod, setNextPeriod] = useState<PeriodSchedule | null>(null);
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("ক্যাম্পাসে পাঠদান চলছে");

  // Filtering & Carousel
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Queries
  const { data: noticesData } = useGetPublicNoticesQuery();
  const { data: routineData } = useGetRoutinesQuery();
  const { data: calendarData } = useGetCalendarEventsQuery();

  const notices = useMemo(() => {
    return (noticesData?.data ?? []) as Array<{
      _id: string;
      title: string;
      body: string;
      category?: string;
      createdAt: string;
    }>;
  }, [noticesData]);

  const routines = useMemo(() => {
    return (routineData?.data ?? []) as Array<{
      _id: string;
      day?: string | number;
      period?: number;
      startTime?: string;
      endTime?: string;
      classId?: { _id?: string; name: string };
      subjectId?: { name: string; nameBn?: string };
      teacherId?: { name: string };
      roomNo?: string;
    }>;
  }, [routineData]);

  const calendarEvents = useMemo(() => {
    return (calendarData?.data ?? []) as Array<{
      _id: string;
      title: string;
      titleBn?: string;
      date: string;
      type?: string;
    }>;
  }, [calendarData]);

  // Play school bell chime
  const playBellChime = useCallback(() => {
    if (!chimeEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {}
  }, [chimeEnabled]);

  // Update clock & compute active periods every second
  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
      setDateStrBn(
        now.toLocaleDateString("bn-BD", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
      const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      setDayName(daysEn[now.getDay()]);
      setDayIdx(now.getDay());

      // Period Calculation
      const currentMins = now.getHours() * 60 + now.getMinutes();
      let activeP: PeriodSchedule | null = null;
      let nextP: PeriodSchedule | null = null;
      let minsLeft: number | null = null;

      for (let i = 0; i < PERIOD_SCHEDULE.length; i++) {
        const item = PERIOD_SCHEDULE[i];
        const start = item.startH * 60 + item.startM;
        const end = item.endH * 60 + item.endM;

        if (currentMins >= start && currentMins < end) {
          activeP = item;
          minsLeft = end - currentMins;
          nextP = PERIOD_SCHEDULE[i + 1] || null;
          break;
        } else if (currentMins < start && !nextP) {
          nextP = item;
        }
      }

      setCurrentPeriod(activeP);
      setNextPeriod(nextP);
      setMinutesRemaining(minsLeft);

      if (now.getDay() === 5 || now.getDay() === 6) {
        setStatusMessage("সাপ্তাহিক ছুটি (Weekend)");
      } else if (currentMins < 9 * 60) {
        setStatusMessage("প্রাতঃকালীন সমাবেশ ও প্রস্তুতি (Morning Assembly)");
      } else if (currentMins >= 14 * 60) {
        setStatusMessage("আজকের পাঠদান সমাপ্ত (School Hours Concluded)");
      } else if (activeP?.isBreak) {
        setStatusMessage("টিফিন বিরতি চলমান (Tiffin Break)");
      } else if (activeP) {
        setStatusMessage("শ্রেণিকক্ষে নিয়মিত ক্লাস চলমান");
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter today's routines safely matching day as number (0-6) or string
  const todayRoutines = useMemo(() => {
    // If Friday (5) or Saturday (6), show Sunday (0) routines as preview
    const effectiveDay = dayIdx > 4 ? 0 : dayIdx;

    return routines.filter((r) => {
      if (r.day === undefined || r.day === null) return false;
      if (typeof r.day === "number") return r.day === effectiveDay;
      const str = String(r.day).trim().toLowerCase();
      if (str === String(effectiveDay)) return true;
      return Boolean(dayName && str === dayName.toLowerCase());
    });
  }, [routines, dayIdx, dayName]);

  // Unique classes present in today's routines
  const availableClasses = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of todayRoutines) {
      if (r.classId?.name) {
        map.set(r.classId.name, r.classId.name);
      }
    }
    return Array.from(map.values()).sort();
  }, [todayRoutines]);

  // Auto-rotate through classes every 10s if enabled
  useEffect(() => {
    if (!autoRotate || availableClasses.length <= 1) return;
    const timer = setInterval(() => {
      setSelectedClassFilter((prev) => {
        if (prev === "all") return availableClasses[0] || "all";
        const idx = availableClasses.indexOf(prev);
        if (idx === -1 || idx === availableClasses.length - 1) return "all";
        return availableClasses[idx + 1];
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRotate, availableClasses]);

  // Filtered routines based on class selector
  const displayedRoutines = useMemo(() => {
    const list =
      selectedClassFilter === "all"
        ? todayRoutines
        : todayRoutines.filter((r) => r.classId?.name === selectedClassFilter);

    return [...list].sort((a, b) => {
      const pa = a.period ?? 0;
      const pb = b.period ?? 0;
      if (pa !== pb) return pa - pb;
      return (a.classId?.name || "").localeCompare(b.classId?.name || "");
    });
  }, [todayRoutines, selectedClassFilter]);

  // Active ongoing routine slot
  const ongoingRoutineSlot = useMemo(() => {
    if (!currentPeriod || currentPeriod.period === 0) return null;
    return displayedRoutines.find((r) => r.period === currentPeriod.period);
  }, [currentPeriod, displayedRoutines]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  const settings = session?.data.settings;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 antialiased selection:bg-emerald-500 selection:text-black font-sans relative overflow-x-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* ================= TOP BAR: MASTHEAD & REALTIME CLOCK ================= */}
      <header className="relative z-10 flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
        {/* School Branding */}
        <div className="flex items-center gap-4">
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="h-16 w-16 rounded-2xl border-2 border-emerald-500/60 object-cover bg-white shadow-lg shadow-emerald-500/10 shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-slate-900 border-2 border-emerald-500/60 flex items-center justify-center text-3xl font-black text-emerald-400 shadow-lg shadow-emerald-500/10 shrink-0">
              🏛️
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                {settings?.name || "School Management System"}
              </h1>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                BROADCAST TV
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span>{settings?.motto || "Excellence in Education"}</span>
              {settings?.eiin && <span className="text-slate-500">· EIIN: {settings.eiin}</span>}
              <span className="text-emerald-400 font-medium">· {statusMessage}</span>
            </p>
          </div>
        </div>

        {/* Real-time Digital Clock & Screen Controls */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="font-mono text-3xl sm:text-4xl font-black tracking-wider text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              {time}
            </div>
            <div className="text-xs font-semibold text-slate-300 mt-0.5">{dateStr}</div>
            <div className="text-[11px] text-slate-400 font-medium">{dateStrBn}</div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <button
              type="button"
              onClick={() => {
                setChimeEnabled(!chimeEnabled);
                if (!chimeEnabled) playBellChime();
              }}
              className={`h-9 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                chimeEnabled
                  ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
              title="ঘণ্টা ধ্বনি চালু/বন্ধ"
            >
              <span>{chimeEnabled ? "🔔 ঘণ্টা চালু" : "🔕 ঘণ্টা বন্ধ"}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-1.5"
              title="Toggle Fullscreen (F11)"
            >
              <span>{isFullscreen ? "✕ Exit" : "⛶ Fullscreen"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= LIVE RADAR SPOTLIGHT ================= */}
      <section className="relative z-10 my-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-xl text-emerald-400 shrink-0">
              {currentPeriod?.isBreak ? "☕" : "🔴"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                  {currentPeriod ? currentPeriod.labelBn : "ক্লাস বিরতি"}
                </span>
                {minutesRemaining !== null && (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.2 text-[10px] font-mono font-bold animate-pulse">
                    আর {minutesRemaining} মিনিট বাকি
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {currentPeriod?.isBreak
                  ? "টিফিন বিরতি — সকল শিক্ষার্থী শৃঙ্খলা বজায় রাখুন"
                  : ongoingRoutineSlot?.subjectId?.name
                  ? `${ongoingRoutineSlot.subjectId.name} (${ongoingRoutineSlot.classId?.name || "শ্রেণি"}) — শিক্ষক: ${ongoingRoutineSlot.teacherId?.name || "নির্ধারিত শিক্ষক"}`
                  : statusMessage}
              </h2>
            </div>
          </div>

          {/* Next Period Info */}
          {nextPeriod && (
            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-xl shrink-0 text-xs">
              <span className="text-slate-400 font-medium">পরবর্তী পিরিয়ড:</span>
              <span className="font-bold text-amber-400">{nextPeriod.labelBn}</span>
              <span className="font-mono text-slate-400 text-[11px]">
                ({String(nextPeriod.startH).padStart(2, "0")}:{String(nextPeriod.startM).padStart(2, "0")})
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ================= MAIN CONTENT GRID ================= */}
      <main className="relative z-10 my-2 grid flex-1 gap-6 lg:grid-cols-12">
        {/* LEFT 8 COLS: TODAY'S CLASS ROUTINE */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-lg">
          <div>
            {/* Header & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Today&apos;s Class Routine · {dayName}
                </h3>
              </div>

              {/* Class Tabs & Carousel Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 ${
                    autoRotate
                      ? "bg-emerald-950/80 border border-emerald-700/60 text-emerald-300"
                      : "bg-slate-800 border border-slate-700 text-slate-400"
                  }`}
                  title="Auto-rotate classes on display"
                >
                  <span>{autoRotate ? "▶ Auto-Rotate ON" : "⏸ Paused"}</span>
                </button>

                <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] no-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClassFilter("all");
                      setAutoRotate(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedClassFilter === "all"
                        ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    All Classes
                  </button>

                  {availableClasses.map((clsName) => (
                    <button
                      key={clsName}
                      type="button"
                      onClick={() => {
                        setSelectedClassFilter(clsName);
                        setAutoRotate(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                        selectedClassFilter === clsName
                          ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {clsName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Routines Grid */}
            {!displayedRoutines.length ? (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-12 text-center text-xs text-slate-400">
                No active classes scheduled for {dayName}.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 max-h-[460px] overflow-y-auto pr-1">
                {displayedRoutines.map((item) => {
                  const isCurrent = currentPeriod?.period === item.period;

                  return (
                    <div
                      key={item._id}
                      className={`rounded-xl border p-4 transition relative overflow-hidden flex flex-col justify-between ${
                        isCurrent
                          ? "border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                          : "border-slate-800/90 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg tracking-wider animate-pulse">
                          NOW ONGOING
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span
                            className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                              isCurrent ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            Period #{item.period}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-white mt-1">
                          {item.subjectId?.name || "Subject"}
                        </h4>
                        {item.subjectId?.nameBn && (
                          <p className="text-xs text-slate-400">{item.subjectId.nameBn}</p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                        <span>
                          Class: <strong className="text-white">{item.classId?.name || "—"}</strong>
                        </span>
                        <span>
                          Teacher: <strong className="text-white">{item.teacherId?.name || "—"}</strong>
                        </span>
                        {item.roomNo && (
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                            Room {item.roomNo}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing: <strong className="text-white">{selectedClassFilter === "all" ? "All Classes" : selectedClassFilter}</strong>
            </span>
            <span className="font-mono text-emerald-400">Total Classes: {displayedRoutines.length}</span>
          </div>
        </div>

        {/* RIGHT 4 COLS: NOTICES & CALENDAR */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Notices Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col flex-1 shadow-lg">
            <div className="border-b border-slate-800 pb-3 mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <span>📢</span>
                Notice Board
              </h3>
              <span className="text-xs text-slate-400 font-mono">{notices.length} notices</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
              {!notices.length ? (
                <p className="text-slate-500 text-xs italic p-4 text-center">No notices posted today.</p>
              ) : (
                notices.map((n) => (
                  <div
                    key={n._id}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider">
                        {n.category || "Notice"}
                      </span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100">{n.title}</h4>
                    {n.body && (
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Academic Calendar Events */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
            <div className="border-b border-slate-800 pb-3 mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                <span>🗓️</span>
                Upcoming Milestones
              </h3>
              <span className="text-xs text-slate-400 font-mono">{calendarEvents.length} events</span>
            </div>

            {!calendarEvents.length ? (
              <p className="text-slate-500 text-xs italic">No upcoming events scheduled.</p>
            ) : (
              <div className="space-y-2">
                {calendarEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev._id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      <div>
                        <span className="font-bold text-white block">{ev.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[10px] px-2 py-0.5 font-bold uppercase">
                      {ev.type || "Event"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ================= BOTTOM TICKER: LIVE MARQUEE ================= */}
      <footer className="relative z-10 border-t border-slate-800 pt-3 flex items-center gap-3">
        <span className="rounded-xl bg-rose-950 border border-rose-800/80 text-rose-300 px-3 py-1 text-xs font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          Live Updates
        </span>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="text-xs font-medium text-slate-300 truncate">
            {notices.map((n) => `🔴 ${n.title}`).join("   ✦   ") ||
              "Welcome to our digital campus. Admission applications are now open online."}
          </div>
        </div>
      </footer>
    </div>
  );
}
