import { baseApi, type Envelope } from "./baseApi";

export const peopleApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    updateStudent: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/students/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Students", "Dashboard", "Reports"],
    }),
    updateTeacher: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/teachers/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Teachers", "Dashboard"],
    }),
    updateUser: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useUpdateStudentMutation, useUpdateTeacherMutation, useUpdateUserMutation } = peopleApi;
