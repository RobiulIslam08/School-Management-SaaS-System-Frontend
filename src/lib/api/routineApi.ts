import { baseApi, type Envelope } from "./baseApi";

export const routineApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getRoutines: build.query<Envelope<unknown[]>, { classId?: string; section?: string } | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.classId) search.set("classId", params.classId);
        if (params?.section) search.set("section", params.section);
        return `/routines?${search.toString()}`;
      },
      providesTags: ["Routines"],
    }),
    saveRoutine: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/routines", method: "POST", body }),
      invalidatesTags: ["Routines"],
    }),
    deleteRoutine: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/routines/${id}`, method: "DELETE" }),
      invalidatesTags: ["Routines"],
    }),
  }),
});

export const { useGetRoutinesQuery, useSaveRoutineMutation, useDeleteRoutineMutation } = routineApi;
