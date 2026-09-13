import { baseApi, type Envelope } from "./baseApi";

export const subjectApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    updateSubject: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/subjects/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Subjects"],
    }),
    deleteSubject: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/subjects/${id}`, method: "DELETE" }),
      invalidatesTags: ["Subjects"],
    }),
    reorderSubjects: build.mutation<Envelope<unknown[]>, { classId: string; orderedIds: string[] }>({
      query: (body) => ({ url: "/subjects/reorder", method: "PATCH", body }),
      invalidatesTags: ["Subjects"],
    }),
    assignSubjectTeacher: build.mutation<Envelope<unknown>, { id: string; teacherId?: string }>({
      query: ({ id, teacherId }) => ({ url: `/subjects/${id}/teacher`, method: "PATCH", body: { teacherId } }),
      invalidatesTags: ["Subjects", "Teachers"],
    }),
  }),
});

export const {
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useReorderSubjectsMutation,
  useAssignSubjectTeacherMutation,
} = subjectApi;
