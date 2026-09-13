import { baseApi, type Envelope } from "./baseApi";

export const classApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    updateClass: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/classes/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Classes", "Dashboard"],
    }),
    archiveClass: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/classes/${id}/archive`, method: "POST" }),
      invalidatesTags: ["Classes", "Dashboard"],
    }),
    deleteClass: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/classes/${id}`, method: "DELETE" }),
      invalidatesTags: ["Classes", "Dashboard"],
    }),
    getClassWorkspace: build.query<Envelope<Record<string, unknown>>, string>({
      query: (id) => `/classes/${id}/workspace`,
      providesTags: ["Classes"],
    }),
    saveClassSection: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/classes/${id}/sections`, method: "POST", body }),
      invalidatesTags: ["Classes"],
    }),
    deleteClassSection: build.mutation<Envelope<unknown>, { id: string; name: string }>({
      query: ({ id, name }) => ({ url: `/classes/${id}/sections?name=${encodeURIComponent(name)}`, method: "DELETE" }),
      invalidatesTags: ["Classes"],
    }),
  }),
});

export const {
  useUpdateClassMutation,
  useArchiveClassMutation,
  useDeleteClassMutation,
  useGetClassWorkspaceQuery,
  useSaveClassSectionMutation,
  useDeleteClassSectionMutation,
} = classApi;
