import { baseApi, type Envelope } from "./baseApi";

function qs(params?: Record<string, string | undefined>) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export const financeApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getExpenses: build.query<Envelope<unknown[]>, Record<string, string | undefined> | void>({
      query: (params) => `/expenses${qs(params || undefined)}`,
      providesTags: ["Expenses"],
    }),
    getExpenseSummary: build.query<Envelope<Record<string, unknown>>, { year?: string; month?: string } | void>({
      query: (params) => `/expenses/summary${qs(params || undefined)}`,
      providesTags: ["Expenses"],
    }),
    createExpense: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/expenses", method: "POST", body }),
      invalidatesTags: ["Expenses", "Accounts", "Dashboard"],
    }),
    updateExpense: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Expenses", "Accounts", "Dashboard"],
    }),
    deleteExpense: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Expenses", "Accounts", "Dashboard"],
    }),
    getDonations: build.query<Envelope<unknown[]>, Record<string, string | undefined> | void>({
      query: (params) => `/donations${qs(params || undefined)}`,
      providesTags: ["Donations"],
    }),
    getDonationSummary: build.query<Envelope<Record<string, unknown>>, { year?: string; month?: string } | void>({
      query: (params) => `/donations/summary${qs(params || undefined)}`,
      providesTags: ["Donations"],
    }),
    createDonation: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/donations", method: "POST", body }),
      invalidatesTags: ["Donations", "Accounts", "Dashboard"],
    }),
    updateDonation: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/donations/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Donations", "Accounts", "Dashboard"],
    }),
    deleteDonation: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/donations/${id}`, method: "DELETE" }),
      invalidatesTags: ["Donations", "Accounts", "Dashboard"],
    }),
    getAccountsSummary: build.query<Envelope<Record<string, unknown>>, { year?: string; month?: string } | void>({
      query: (params) => `/accounts/summary${qs(params || undefined)}`,
      providesTags: ["Accounts"],
    }),
    getStaffAttendance: build.query<Envelope<unknown[]>, { date?: string } | void>({
      query: (params) => `/staff-attendance${qs(params || undefined)}`,
      providesTags: ["StaffAttendance"],
    }),
    getStaffRoster: build.query<Envelope<unknown[]>, void>({
      query: () => "/staff-attendance/roster",
      providesTags: ["StaffAttendance"],
    }),
    getStaffAttendanceDates: build.query<Envelope<string[]>, void>({
      query: () => "/staff-attendance/dates",
      providesTags: ["StaffAttendance"],
    }),
    saveStaffAttendance: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/staff-attendance/bulk", method: "POST", body }),
      invalidatesTags: ["StaffAttendance"],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseSummaryQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetDonationsQuery,
  useGetDonationSummaryQuery,
  useCreateDonationMutation,
  useUpdateDonationMutation,
  useDeleteDonationMutation,
  useGetAccountsSummaryQuery,
  useGetStaffAttendanceQuery,
  useGetStaffRosterQuery,
  useGetStaffAttendanceDatesQuery,
  useSaveStaffAttendanceMutation,
} = financeApi;
