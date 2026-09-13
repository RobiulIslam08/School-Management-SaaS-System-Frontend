import { baseApi, type Envelope } from "./baseApi";
import type { FeatureMap, SchoolSettings, SessionPayload } from "../types";

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
    promoteStudents: build.mutation<Envelope<unknown>, { ids: string[]; targetClassId: string; targetSection: string }>({
      query: (body) => ({ url: "/students/promote", method: "POST", body }),
      invalidatesTags: ["Students"],
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
    getExams: build.query<Envelope<unknown[]>, void>({ query: () => "/exams", providesTags: ["Exams"] }),
    createExam: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/exams", method: "POST", body }),
      invalidatesTags: ["Exams"],
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
    recomputeMerit: build.mutation<Envelope<unknown>, string>({
      query: (examTypeId) => ({ url: `/results/${examTypeId}/merit`, method: "POST" }),
      invalidatesTags: ["Results"],
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
      invalidatesTags: ["Fees", "Dashboard"],
    }),
    addPayment: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/fees/ledgers/${id}/payments`, method: "POST", body }),
      invalidatesTags: ["Fees", "Dashboard"],
    }),
    getFeeSummary: build.query<Envelope<{ due: number; collected: number; byMethod: Record<string, number> }>, void>({
      query: () => "/fees/summary",
      providesTags: ["Fees"],
    }),
    getNotices: build.query<Envelope<unknown[]>, void>({ query: () => "/notices", providesTags: ["Notices"] }),
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
      invalidatesTags: ["Payroll"],
    }),
    payPayroll: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/payroll/${id}/pay`, method: "PATCH" }),
      invalidatesTags: ["Payroll"],
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
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useGetAttendanceQuery,
  useGetRosterQuery,
  useSaveAttendanceMutation,
  useGetExamsQuery,
  useCreateExamMutation,
  useGetRulesQuery,
  useCreateRuleMutation,
  useGetResultsQuery,
  useSaveResultMutation,
  useRecomputeMeritMutation,
  useGetFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useGetLedgersQuery,
  useCreateLedgerMutation,
  useAddPaymentMutation,
  useGetFeeSummaryQuery,
  useGetNoticesQuery,
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
} = schoolApi;
