import { baseApi, type Envelope } from "./baseApi";

export const operationsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    updateBook: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/library/books/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Library"],
    }),
    deleteBook: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/library/books/${id}`, method: "DELETE" }),
      invalidatesTags: ["Library"],
    }),
    returnBook: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/library/issues/${id}/return`, method: "PATCH" }),
      invalidatesTags: ["Library"],
    }),
    updateRoute: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/transport/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Transport"],
    }),
    deleteRoute: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/transport/${id}`, method: "DELETE" }),
      invalidatesTags: ["Transport"],
    }),
    updateHostel: build.mutation<Envelope<unknown>, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/hostels/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Hostel"],
    }),
    deleteHostel: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/hostels/${id}`, method: "DELETE" }),
      invalidatesTags: ["Hostel"],
    }),
  }),
});

export const {
  useUpdateBookMutation,
  useDeleteBookMutation,
  useReturnBookMutation,
  useUpdateRouteMutation,
  useDeleteRouteMutation,
  useUpdateHostelMutation,
  useDeleteHostelMutation,
} = operationsApi;
