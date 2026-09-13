import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../utils";

export interface Envelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  errors: Array<{ field: string; message: string }> | null;
}

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
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include",
  }),
  endpoints: () => ({}),
});
