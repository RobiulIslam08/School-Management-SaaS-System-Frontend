import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { requestUrl, shouldSkipSessionRefresh } from "../session-refresh";
import { API_URL } from "../utils";

export interface Envelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  errors: Array<{ field: string; message: string }> | null;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
});

let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(api: BaseQueryApi, extraOptions: object): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = Promise.resolve(rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions))
      .then((result) => !result.error)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status !== 401 || shouldSkipSessionRefresh(requestUrl(args))) {
    return result;
  }
  const refreshed = await refreshSession(api, extraOptions);
  if (!refreshed) return result;
  return rawBaseQuery(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: "api",
  tagTypes: [
    "Session",
    "Settings",
    "Features",
    "Users",
    "Classes",
    "Subjects",
    "Students",
    "Teachers",
    "Attendance",
    "Exams",
    "Rules",
    "Results",
    "Fees",
    "Expenses",
    "Donations",
    "Accounts",
    "StaffAttendance",
    "Notices",
    "Sms",
    "Payroll",
    "Library",
    "Transport",
    "Hostel",
    "Reports",
    "Dashboard",
    "Certificates",
    "Routines",
  ],
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});
