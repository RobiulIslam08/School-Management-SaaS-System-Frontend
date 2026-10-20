import { baseApi, type Envelope } from "./baseApi";
import type { FeatureMap, SchoolSettings, SessionPayload } from "../types";

export interface PassListRow {
  _id: string;
  studentId?: {
    _id?: string;
    name?: string;
    nameBn?: string;
    studentId?: string;
    rollNo?: string;
    section?: string;
    classId?: { name?: string };
  };
  gpa?: number;
  letter?: string;
  totalObtained?: number;
  meritPosition?: number;
}

export interface FailListRow {
  _id: string;
  studentId?: {
    _id?: string;
    name?: string;
    nameBn?: string;
    studentId?: string;
    rollNo?: string;
    section?: string;
    classId?: { name?: string };
  };
  gpa?: number;
  letter?: string;
  failedSubjects?: Array<{
    subjectName?: string;
    obtainedMarks?: number;
    passMarks?: number;
  }>;
}

export interface ExamStatsResult {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  avgGpa: number;
  avgPercent: number;
  subjectStats: Array<{
    subjectId: string;
    name: string;
    code: string;
    avgObtained: number;
    avgPercent: number;
    passRate: number;
    count: number;
  }>;
}

export const schoolApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    login: build.mutation<Envelope<{ requiresTwoFactor: boolean; tempToken?: string; user?: unknown }>, { email: string; password: string; owner?: boolean }>({
      query: ({ owner, ...body }) => ({ url: owner ? "/owner/login" : "/auth/login", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    forgotPassword: build.mutation<
      Envelope<{ requested: true; delivery: "pending"; devCode?: string }>,
      { email: string; owner?: boolean }
    >({
      query: ({ owner, ...body }) => ({
        url: owner ? "/owner/forgot-password" : "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: build.mutation<
      Envelope<{ updated: boolean }>,
      { email: string; code: string; password: string; owner?: boolean }
    >({
      query: ({ owner, ...body }) => ({
        url: owner ? "/owner/reset-password" : "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
    verify2fa: build.mutation<Envelope<{ user: unknown }>, { tempToken: string; code: string }>({
      query: (body) => ({ url: "/auth/2fa", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    logout: build.mutation<Envelope<{ loggedOut: boolean }>, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Session"],
    }),
    me: build.query<Envelope<SessionPayload>, void>({
      query: () => "/auth/me",
      providesTags: ["Session"],
    }),
    getSettings: build.query<Envelope<SchoolSettings>, void>({
      query: () => "/settings",
      providesTags: ["Settings"],
    }),
    updateSettings: build.mutation<Envelope<SchoolSettings>, Partial<SchoolSettings>>({
      query: (body) => ({ url: "/settings", method: "PATCH", body }),
      invalidatesTags: ["Settings", "Session"],
    }),
    getPackages: build.query<Envelope<{ modules: FeatureMap; labels: Record<string, string> }>, void>({
      query: () => "/owner/packages",
      providesTags: ["Features"],
    }),
    updatePackages: build.mutation<Envelope<{ modules: FeatureMap }>, { modules: FeatureMap }>({
      query: (body) => ({ url: "/owner/packages", method: "PATCH", body }),
      invalidatesTags: ["Features", "Session"],
    }),
    setup2fa: build.mutation<Envelope<{ secret: string; otpauth: string }>, void>({
      query: () => ({ url: "/owner/2fa/setup", method: "POST" }),
    }),
    getUsers: build.query<Envelope<unknown[]>, void>({ query: () => "/users", providesTags: ["Users"] }),
    createUser: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    getClasses: build.query<Envelope<unknown[]>, void>({ query: () => "/classes", providesTags: ["Classes"] }),
    createClass: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/classes", method: "POST", body }),
      invalidatesTags: ["Classes"],
    }),
    getSubjects: build.query<Envelope<unknown[]>, string | void>({
      query: (classId) => (classId ? `/subjects?classId=${classId}` : "/subjects"),
      providesTags: ["Subjects"],
    }),
    createSubject: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/subjects", method: "POST", body }),
      invalidatesTags: ["Subjects"],
    }),
    getStudents: build.query<Envelope<unknown[]>, Record<string, string | undefined> | void>({
      query: (params) => {
        const search = new URLSearchParams();
        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value) search.set(key, value);
        });
        return `/students?${search.toString()}`;
      },
      providesTags: ["Students"],
    }),
    getStudent: build.query<Envelope<unknown>, string>({
      query: (id) => `/students/${id}`,
      providesTags: ["Students"],
    }),
    createStudent: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: ["Students", "Dashboard"],
    }),
    promoteStudents: build.mutation<
      Envelope<unknown>,
      { ids: string[]; targetClassId: string; targetSection: string; targetAcademicYear?: string }
    >({
      query: (body) => ({ url: "/students/promote", method: "POST", body }),
      invalidatesTags: ["Students"],
    }),
    revertStudentsPromotion: build.mutation<Envelope<{ revertedCount: number }>, { ids: string[] }>({
      query: (body) => ({ url: "/students/revert-promotion", method: "POST", body }),
      invalidatesTags: ["Students"],
    }),
    transferOutStudents: build.mutation<
      Envelope<{ modifiedCount: number }>,
      { ids: string[]; removeFromClass?: boolean; reason?: string }
    >({
      query: (body) => ({ url: "/students/transfer-out", method: "POST", body }),
      invalidatesTags: ["Students"],
    }),
    promoteAllStudents: build.mutation<
      Envelope<{ promoted: number; alumni: number; skipped: number; academicYear: string; yearAdvanced: boolean }>,
      void
    >({
      query: () => ({ url: "/students/promote-all", method: "POST", body: {} }),
      invalidatesTags: ["Students", "Session"],
    }),
    getTeachers: build.query<Envelope<unknown[]>, string | void>({
      query: (q) => (q ? `/teachers?q=${q}` : "/teachers"),
      providesTags: ["Teachers"],
    }),
    createTeacher: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/teachers", method: "POST", body }),
      invalidatesTags: ["Teachers"],
    }),
    getAttendance: build.query<Envelope<unknown[]>, Record<string, string>>({
      query: (params) => `/attendance?${new URLSearchParams(params).toString()}`,
      providesTags: ["Attendance"],
    }),
    getRoster: build.query<Envelope<unknown[]>, { classId: string; section: string }>({
      query: (params) => `/attendance/roster?${new URLSearchParams(params).toString()}`,
    }),
    saveAttendance: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/attendance/bulk", method: "POST", body }),
      invalidatesTags: ["Attendance", "Dashboard"],
    }),
    getExams: build.query<Envelope<unknown[]>, { academicYear?: string } | void>({
      query: (params) => {
        const year = params && typeof params === "object" ? params.academicYear : undefined;
        return year ? `/exams?academicYear=${encodeURIComponent(year)}` : "/exams";
      },
      providesTags: ["Exams"],
    }),
    createExam: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/exams", method: "POST", body }),
      invalidatesTags: ["Exams"],
    }),
    updateExam: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/exams/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Exams", "Rules"],
    }),
    deleteExam: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/exams/${id}`, method: "DELETE" }),
      invalidatesTags: ["Exams", "Rules"],
    }),
    getRules: build.query<Envelope<unknown[]>, void>({ query: () => "/grading-rules", providesTags: ["Rules"] }),
    createRule: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/grading-rules", method: "POST", body }),
      invalidatesTags: ["Rules"],
    }),
    getResults: build.query<Envelope<unknown[]>, Record<string, string> | void>({
      query: (params) => {
        const search = new URLSearchParams();
        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value) search.set(key, value);
        });
        return `/results?${search.toString()}`;
      },
      providesTags: ["Results"],
    }),
    saveResult: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/results", method: "POST", body }),
      invalidatesTags: ["Results"],
    }),
    recomputeMerit: build.mutation<
      Envelope<unknown>,
      { examTypeId: string; classId?: string; section?: string } | string
    >({
      query: (arg) => {
        const examTypeId = typeof arg === "string" ? arg : arg.examTypeId;
        const body = typeof arg === "string" ? {} : { classId: arg.classId, section: arg.section };
        return { url: `/results/${examTypeId}/merit`, method: "POST", body };
      },
      invalidatesTags: ["Results"],
    }),
    getFinalGrade: build.query<Envelope<{ finalGpa: number; parts: unknown[] }>, { studentId: string; academicYear: string }>({
      query: ({ studentId, academicYear }) =>
        `/results/final/${studentId}?academicYear=${encodeURIComponent(academicYear)}`,
    }),
    getFeeStructures: build.query<Envelope<unknown[]>, void>({ query: () => "/fees/structures", providesTags: ["Fees"] }),
    createFeeStructure: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/fees/structures", method: "POST", body }),
      invalidatesTags: ["Fees"],
    }),
    getLedgers: build.query<Envelope<unknown[]>, Record<string, string> | void>({
      query: (params) => `/fees/ledgers?${new URLSearchParams(params ?? {}).toString()}`,
      providesTags: ["Fees"],
    }),
    createLedger: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/fees/ledgers", method: "POST", body }),
      invalidatesTags: ["Fees", "Dashboard", "Accounts"],
    }),
    addPayment: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/fees/ledgers/${id}/payments`, method: "POST", body }),
      invalidatesTags: ["Fees", "Dashboard", "Accounts"],
    }),
    recordFeePayments: build.mutation<
      Envelope<{
        receiptNo: string;
        method: string;
        refNo: string;
        date: string;
        academicYear: string;
        student: { name: string; studentId: string; className: string };
        lines: Array<{ ledgerId?: string; title?: string; amount: number }>;
      }>,
      {
        studentId?: string;
        method: string;
        refNo?: string;
        note?: string;
        date?: string;
        lines: Array<{ ledgerId?: string; title?: string; amount: number }>;
      }
    >({
      query: (body) => ({ url: "/fees/payments", method: "POST", body }),
      invalidatesTags: ["Fees", "Dashboard", "Accounts"],
    }),
    getFeeSummary: build.query<
      Envelope<{
        due: number;
        collected: number;
        byMethod: Record<string, number>;
        byClass?: Array<{ classId: string; name: string; due: number; collected: number; studentCount: number }>;
      }>,
      void
    >({
      query: () => "/fees/summary",
      providesTags: ["Fees"],
    }),
    getNotices: build.query<
      Envelope<unknown[]>,
      { status?: string; audience?: string; q?: string; category?: string } | void
    >({
      query: (params) => {
        if (!params) return "/notices";
        const search = new URLSearchParams();
        if (params.status) search.set("status", params.status);
        if (params.audience) search.set("audience", params.audience);
        if (params.category) search.set("category", params.category);
        if (params.q) search.set("q", params.q);
        const qs = search.toString();
        return qs ? `/notices?${qs}` : "/notices";
      },
      providesTags: ["Notices"],
    }),
    getNotice: build.query<Envelope<Record<string, unknown>>, string>({
      query: (id) => `/notices/${id}`,
      providesTags: ["Notices"],
    }),
    getPublicNotices: build.query<Envelope<unknown[]>, void>({
      query: () => "/public/notices",
    }),
    createNotice: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/notices", method: "POST", body }),
      invalidatesTags: ["Notices", "Dashboard"],
    }),
    sendSms: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/sms", method: "POST", body }),
      invalidatesTags: ["Sms"],
    }),
    getSms: build.query<Envelope<unknown[]>, void>({ query: () => "/sms", providesTags: ["Sms"] }),
    getPayroll: build.query<Envelope<unknown[]>, void>({ query: () => "/payroll", providesTags: ["Payroll"] }),
    createPayroll: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/payroll", method: "POST", body }),
      invalidatesTags: ["Payroll", "Accounts", "Dashboard"],
    }),
    payPayroll: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/payroll/${id}/pay`, method: "PATCH" }),
      invalidatesTags: ["Payroll", "Accounts", "Dashboard"],
    }),
    getBooks: build.query<Envelope<unknown[]>, void>({ query: () => "/library/books", providesTags: ["Library"] }),
    createBook: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/library/books", method: "POST", body }),
      invalidatesTags: ["Library"],
    }),
    getIssues: build.query<Envelope<unknown[]>, void>({ query: () => "/library/issues", providesTags: ["Library"] }),
    issueBook: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/library/issues", method: "POST", body }),
      invalidatesTags: ["Library"],
    }),
    getTransport: build.query<Envelope<unknown[]>, void>({ query: () => "/transport", providesTags: ["Transport"] }),
    createRoute: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/transport", method: "POST", body }),
      invalidatesTags: ["Transport"],
    }),
    getHostels: build.query<Envelope<unknown[]>, void>({ query: () => "/hostels", providesTags: ["Hostel"] }),
    createHostel: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/hostels", method: "POST", body }),
      invalidatesTags: ["Hostel"],
    }),
    getAreaReport: build.query<Envelope<unknown[]>, void>({ query: () => "/reports/areas", providesTags: ["Reports"] }),
    getTalent: build.query<Envelope<unknown[]>, void>({ query: () => "/reports/talent", providesTags: ["Reports"] }),
    getDashboard: build.query<Envelope<Record<string, unknown>>, void>({ query: () => "/dashboard", providesTags: ["Dashboard"] }),
    getBranding: build.query<Envelope<Record<string, unknown>>, void>({ query: () => "/public/branding" }),
    publicAdmit: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/public/admissions", method: "POST", body }),
    }),
    guardianPortal: build.query<Envelope<Record<string, unknown>>, string | void>({
      query: (studentId) => (studentId ? `/portal/guardian?studentId=${studentId}` : "/portal/guardian"),
    }),
    teacherPortal: build.query<Envelope<Record<string, unknown>>, void>({
      query: () => "/portal/teacher",
    }),
    getCertificateTemplates: build.query<Envelope<unknown[]>, void>({
      query: () => "/certificates/templates",
      providesTags: ["Certificates"],
    }),
    updateCertificateTemplate: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/certificates/templates/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Certificates"],
    }),
    getCertificates: build.query<Envelope<unknown[]>, { kind?: string; classId?: string } | string | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (typeof arg === "string") params.set("kind", arg);
        else {
          if (arg?.kind) params.set("kind", arg.kind);
          if (arg?.classId) params.set("classId", arg.classId);
        }
        const qs = params.toString();
        return qs ? `/certificates?${qs}` : "/certificates";
      },
      providesTags: ["Certificates"],
    }),
    issueCertificate: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/certificates", method: "POST", body }),
      invalidatesTags: ["Certificates"],
    }),
    // Routines
    getRoutines: build.query<Envelope<Record<string, unknown>[]>, { classId?: string; teacherId?: string; day?: string } | void>({
      query: (arg) => {
        const p = new URLSearchParams();
        if (arg?.classId) p.set("classId", arg.classId);
        if (arg?.teacherId) p.set("teacherId", arg.teacherId);
        if (arg?.day) p.set("day", arg.day);
        const qs = p.toString();
        return `/routines${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Routines"],
    }),
    createRoutineSlot: build.mutation<Envelope<Record<string, unknown>>, Record<string, unknown>>({
      query: (body) => ({ url: "/routines", method: "POST", body }),
      invalidatesTags: ["Routines"],
    }),
    deleteRoutineSlot: build.mutation<Envelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/routines/${id}`, method: "DELETE" }),
      invalidatesTags: ["Routines"],
    }),
    // Result Enhancements
    getPassList: build.query<
      Envelope<PassListRow[]>,
      { examTypeId: string; classId?: string; section?: string }
    >({
      query: ({ examTypeId, classId, section }) => {
        const p = new URLSearchParams();
        if (classId) p.set("classId", classId);
        if (section) p.set("section", section);
        const qs = p.toString();
        return `/results/${examTypeId}/pass-list${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Results"],
    }),
    getFailList: build.query<
      Envelope<FailListRow[]>,
      { examTypeId: string; classId?: string; section?: string }
    >({
      query: ({ examTypeId, classId, section }) => {
        const p = new URLSearchParams();
        if (classId) p.set("classId", classId);
        if (section) p.set("section", section);
        const qs = p.toString();
        return `/results/${examTypeId}/fail-list${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Results"],
    }),
    getResultStats: build.query<
      Envelope<ExamStatsResult>,
      { examTypeId: string; classId?: string; section?: string }
    >({
      query: ({ examTypeId, classId, section }) => {
        const p = new URLSearchParams();
        if (classId) p.set("classId", classId);
        if (section) p.set("section", section);
        const qs = p.toString();
        return `/results/${examTypeId}/stats${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Results"],
    }),
    // Academic Calendar
    getCalendarEvents: build.query<
      Envelope<Record<string, unknown>[]>,
      { academicYear?: string; month?: string; year?: string; type?: string } | void
    >({
      query: (arg) => {
        const p = new URLSearchParams();
        if (arg?.academicYear) p.set("academicYear", arg.academicYear);
        if (arg?.month) p.set("month", arg.month);
        if (arg?.year) p.set("year", arg.year);
        if (arg?.type) p.set("type", arg.type);
        const qs = p.toString();
        return `/calendar-events${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Calendar"],
    }),
    createCalendarEvent: build.mutation<Envelope<Record<string, unknown>>, Record<string, unknown>>({
      query: (body) => ({ url: "/calendar-events", method: "POST", body }),
      invalidatesTags: ["Calendar"],
    }),
    updateCalendarEvent: build.mutation<Envelope<Record<string, unknown>>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/calendar-events/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Calendar"],
    }),
    deleteCalendarEvent: build.mutation<Envelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/calendar-events/${id}`, method: "DELETE" }),
      invalidatesTags: ["Calendar"],
    }),
    // Admission Exams
    getAdmissionExams: build.query<Envelope<Record<string, unknown>[]>, { academicYear?: string } | void>({
      query: (arg) => (arg?.academicYear ? `/admission-exams?academicYear=${arg.academicYear}` : "/admission-exams"),
      providesTags: ["AdmissionExams"],
    }),
    createAdmissionExam: build.mutation<Envelope<Record<string, unknown>>, Record<string, unknown>>({
      query: (body) => ({ url: "/admission-exams", method: "POST", body }),
      invalidatesTags: ["AdmissionExams"],
    }),
    updateAdmissionExam: build.mutation<Envelope<Record<string, unknown>>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/admission-exams/${id}`, method: "PATCH", body }),
      invalidatesTags: ["AdmissionExams"],
    }),
    deleteAdmissionExam: build.mutation<Envelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/admission-exams/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdmissionExams"],
    }),
    publishAdmissionExam: build.mutation<Envelope<Record<string, unknown>>, { id: string; isPublished: boolean }>({
      query: ({ id, isPublished }) => ({ url: `/admission-exams/${id}/publish`, method: "PATCH", body: { isPublished } }),
      invalidatesTags: ["AdmissionExams"],
    }),
    getAdmissionResults: build.query<Envelope<Record<string, unknown>[]>, string>({
      query: (examId) => `/admission-exams/${examId}/results`,
      providesTags: ["AdmissionExams"],
    }),
    upsertAdmissionResult: build.mutation<Envelope<Record<string, unknown>>, { examId: string } & Record<string, unknown>>({
      query: ({ examId, ...body }) => ({ url: `/admission-exams/${examId}/results`, method: "POST", body }),
      invalidatesTags: ["AdmissionExams"],
    }),
    bulkSaveAdmissionResults: build.mutation<Envelope<Record<string, unknown>[]>, { examId: string; results: Array<Record<string, unknown>> }>({
      query: ({ examId, results }) => ({ url: `/admission-exams/${examId}/results/bulk`, method: "POST", body: { results } }),
      invalidatesTags: ["AdmissionExams"],
    }),
    // Seat Plans
    getSeatPlan: build.query<Envelope<Record<string, unknown>>, { examId: string; classId?: string; section?: string }>({
      query: ({ examId, classId, section }) => {
        const p = new URLSearchParams();
        if (classId) p.set("classId", classId);
        if (section) p.set("section", section);
        const qs = p.toString();
        return `/seat-plans/${examId}${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["SeatPlans"],
    }),
    generateSeatPlan: build.mutation<Envelope<Record<string, unknown>>, Record<string, unknown>>({
      query: (body) => ({ url: "/seat-plans/generate", method: "POST", body }),
      invalidatesTags: ["SeatPlans"],
    }),
    deleteSeatPlan: build.mutation<Envelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/seat-plans/${id}`, method: "DELETE" }),
      invalidatesTags: ["SeatPlans"],
    }),
    // Lecture Materials
    getLectureMaterials: build.query<
      Envelope<Record<string, unknown>[]>,
      { classId?: string; subjectId?: string; teacherId?: string; academicYear?: string } | void
    >({
      query: (arg) => {
        const p = new URLSearchParams();
        if (arg?.classId) p.set("classId", arg.classId);
        if (arg?.subjectId) p.set("subjectId", arg.subjectId);
        if (arg?.teacherId) p.set("teacherId", arg.teacherId);
        if (arg?.academicYear) p.set("academicYear", arg.academicYear);
        const qs = p.toString();
        return `/lecture-materials${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["LectureMaterials"],
    }),
    createLectureMaterial: build.mutation<Envelope<Record<string, unknown>>, Record<string, unknown>>({
      query: (body) => ({ url: "/lecture-materials", method: "POST", body }),
      invalidatesTags: ["LectureMaterials"],
    }),
    updateLectureMaterial: build.mutation<Envelope<Record<string, unknown>>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/lecture-materials/${id}`, method: "PATCH", body }),
      invalidatesTags: ["LectureMaterials"],
    }),
    deleteLectureMaterial: build.mutation<Envelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/lecture-materials/${id}`, method: "DELETE" }),
      invalidatesTags: ["LectureMaterials"],
    }),
    // Training
    getTrainings: build.query<Envelope<Record<string, unknown>[]>, { status?: string } | void>({
      query: (arg) => (arg?.status ? `/trainings?status=${arg.status}` : "/trainings"),
      providesTags: ["Trainings"],
    }),
    createTraining: build.mutation<Envelope<Record<string, unknown>>, Record<string, unknown>>({
      query: (body) => ({ url: "/trainings", method: "POST", body }),
      invalidatesTags: ["Trainings"],
    }),
    updateTraining: build.mutation<Envelope<Record<string, unknown>>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/trainings/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Trainings"],
    }),
    deleteTraining: build.mutation<Envelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/trainings/${id}`, method: "DELETE" }),
      invalidatesTags: ["Trainings"],
    }),
    updateTrainingAttendance: build.mutation<Envelope<Record<string, unknown>>, { id: string; participants: Array<Record<string, unknown>> }>({
      query: ({ id, participants }) => ({ url: `/trainings/${id}/attendance`, method: "PATCH", body: { participants } }),
      invalidatesTags: ["Trainings"],
    }),
    // Time Attendance
    getTimeAttendanceLogs: build.query<
      Envelope<Record<string, unknown>[]>,
      { date?: string; deviceId?: string; staffId?: string } | void
    >({
      query: (arg) => {
        const p = new URLSearchParams();
        if (arg?.date) p.set("date", arg.date);
        if (arg?.deviceId) p.set("deviceId", arg.deviceId);
        if (arg?.staffId) p.set("staffId", arg.staffId);
        const qs = p.toString();
        return `/time-attendance/logs${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["TimeAttendance"],
    }),
    getTimeAttendanceMappings: build.query<Envelope<Record<string, unknown>[]>, { deviceId?: string } | void>({
      query: (arg) => (arg?.deviceId ? `/time-attendance/mappings?deviceId=${arg.deviceId}` : "/time-attendance/mappings"),
      providesTags: ["TimeAttendance"],
    }),
    upsertTimeAttendanceMapping: build.mutation<Envelope<Record<string, unknown>>, Record<string, unknown>>({
      query: (body) => ({ url: "/time-attendance/mappings", method: "POST", body }),
      invalidatesTags: ["TimeAttendance"],
    }),
    deleteTimeAttendanceMapping: build.mutation<Envelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/time-attendance/mappings/${id}`, method: "DELETE" }),
      invalidatesTags: ["TimeAttendance"],
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerify2faMutation,
  useLogoutMutation,
  useMeQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetPackagesQuery,
  useUpdatePackagesMutation,
  useSetup2faMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetClassesQuery,
  useCreateClassMutation,
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useGetStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  usePromoteStudentsMutation,
  useRevertStudentsPromotionMutation,
  useTransferOutStudentsMutation,
  usePromoteAllStudentsMutation,
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useGetAttendanceQuery,
  useGetRosterQuery,
  useSaveAttendanceMutation,
  useGetExamsQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetRulesQuery,
  useCreateRuleMutation,
  useGetResultsQuery,
  useSaveResultMutation,
  useRecomputeMeritMutation,
  useGetFinalGradeQuery,
  useGetFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useGetLedgersQuery,
  useCreateLedgerMutation,
  useAddPaymentMutation,
  useRecordFeePaymentsMutation,
  useGetFeeSummaryQuery,
  useGetNoticesQuery,
  useGetNoticeQuery,
  useGetPublicNoticesQuery,
  useCreateNoticeMutation,
  useSendSmsMutation,
  useGetSmsQuery,
  useGetPayrollQuery,
  useCreatePayrollMutation,
  usePayPayrollMutation,
  useGetBooksQuery,
  useCreateBookMutation,
  useGetIssuesQuery,
  useIssueBookMutation,
  useGetTransportQuery,
  useCreateRouteMutation,
  useGetHostelsQuery,
  useCreateHostelMutation,
  useGetAreaReportQuery,
  useGetTalentQuery,
  useGetDashboardQuery,
  useGetBrandingQuery,
  usePublicAdmitMutation,
  useGuardianPortalQuery,
  useTeacherPortalQuery,
  useGetCertificateTemplatesQuery,
  useUpdateCertificateTemplateMutation,
  useGetCertificatesQuery,
  useIssueCertificateMutation,
  // Routines
  useGetRoutinesQuery,
  useCreateRoutineSlotMutation,
  useDeleteRoutineSlotMutation,
  // Result Enhancements
  useGetPassListQuery,
  useGetFailListQuery,
  useGetResultStatsQuery,
  // Academic Calendar
  useGetCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  // Admission Exams
  useGetAdmissionExamsQuery,
  useCreateAdmissionExamMutation,
  useUpdateAdmissionExamMutation,
  useDeleteAdmissionExamMutation,
  usePublishAdmissionExamMutation,
  useGetAdmissionResultsQuery,
  useUpsertAdmissionResultMutation,
  useBulkSaveAdmissionResultsMutation,
  // Seat Plans
  useGetSeatPlanQuery,
  useGenerateSeatPlanMutation,
  useDeleteSeatPlanMutation,
  // Lecture Materials
  useGetLectureMaterialsQuery,
  useCreateLectureMaterialMutation,
  useUpdateLectureMaterialMutation,
  useDeleteLectureMaterialMutation,
  // Training
  useGetTrainingsQuery,
  useCreateTrainingMutation,
  useUpdateTrainingMutation,
  useDeleteTrainingMutation,
  useUpdateTrainingAttendanceMutation,
  // Time Attendance
  useGetTimeAttendanceLogsQuery,
  useGetTimeAttendanceMappingsQuery,
  useUpsertTimeAttendanceMappingMutation,
  useDeleteTimeAttendanceMappingMutation,
} = schoolApi;
