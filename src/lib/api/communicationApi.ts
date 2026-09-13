import { baseApi, type Envelope } from "./baseApi";

export const communicationApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    updateNotice: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/notices/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Notices", "Dashboard"],
    }),
    deleteNotice: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/notices/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notices", "Dashboard"],
    }),
  }),
});

export const { useUpdateNoticeMutation, useDeleteNoticeMutation } = communicationApi;
