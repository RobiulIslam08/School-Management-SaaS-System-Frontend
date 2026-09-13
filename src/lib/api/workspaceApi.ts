import { baseApi, type Envelope } from "./baseApi";

export const workspaceApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getAttendanceDates: build.query<Envelope<string[]>, { classId: string; section: string }>({
      query: (params) => `/attendance/dates?${new URLSearchParams(params).toString()}`,
      providesTags: ["Attendance"],
    }),
    publishExam: build.mutation<Envelope<unknown>, { id: string; isPublished: boolean }>({
      query: ({ id, isPublished }) => ({ url: `/exams/${id}/publish`, method: "PATCH", body: { isPublished } }),
      invalidatesTags: ["Exams", "Results"],
    }),
  }),
});

export const { useGetAttendanceDatesQuery, usePublishExamMutation } = workspaceApi;
