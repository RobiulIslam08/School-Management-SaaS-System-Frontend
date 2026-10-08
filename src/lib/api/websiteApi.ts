import { baseApi, type Envelope } from "./baseApi";

export interface WebsiteBundle {
  config: Record<string, unknown> | null;
  pages: Array<Record<string, unknown>>;
  posts: Array<Record<string, unknown>>;
  albums: Array<Record<string, unknown>>;
  media: Array<Record<string, unknown>>;
  people: Array<Record<string, unknown>>;
  files: Array<Record<string, unknown>>;
  inquiries: Array<Record<string, unknown>>;
}

export const websiteApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getWebsite: build.query<Envelope<WebsiteBundle>, void>({
      query: () => "/website",
      providesTags: ["Website"],
    }),
    saveWebsiteConfig: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/website/config", method: "PUT", body }),
      invalidatesTags: ["Website"],
    }),
    saveWebsitePage: build.mutation<Envelope<unknown>, { id?: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => (id ? { url: `/website/pages/${id}`, method: "PATCH", body } : { url: "/website/pages", method: "POST", body }),
      invalidatesTags: ["Website"],
    }),
    deleteWebsitePage: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/website/pages/${id}`, method: "DELETE" }),
      invalidatesTags: ["Website"],
    }),
    saveWebsitePost: build.mutation<Envelope<unknown>, { id?: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => (id ? { url: `/website/posts/${id}`, method: "PATCH", body } : { url: "/website/posts", method: "POST", body }),
      invalidatesTags: ["Website"],
    }),
    deleteWebsitePost: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/website/posts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Website"],
    }),
    saveWebsiteAlbum: build.mutation<Envelope<unknown>, { id?: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => (id ? { url: `/website/albums/${id}`, method: "PATCH", body } : { url: "/website/albums", method: "POST", body }),
      invalidatesTags: ["Website"],
    }),
    deleteWebsiteAlbum: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/website/albums/${id}`, method: "DELETE" }),
      invalidatesTags: ["Website"],
    }),
    saveWebsiteMedia: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/website/media", method: "POST", body }),
      invalidatesTags: ["Website"],
    }),
    deleteWebsiteMedia: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/website/media/${id}`, method: "DELETE" }),
      invalidatesTags: ["Website"],
    }),
    saveWebsitePerson: build.mutation<Envelope<unknown>, { id?: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => (id ? { url: `/website/people/${id}`, method: "PATCH", body } : { url: "/website/people", method: "POST", body }),
      invalidatesTags: ["Website"],
    }),
    deleteWebsitePerson: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/website/people/${id}`, method: "DELETE" }),
      invalidatesTags: ["Website"],
    }),
    saveWebsiteFile: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/website/files", method: "POST", body }),
      invalidatesTags: ["Website"],
    }),
    deleteWebsiteFile: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/website/files/${id}`, method: "DELETE" }),
      invalidatesTags: ["Website"],
    }),
    markWebsiteInquiry: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/website/inquiries/${id}`, method: "PATCH", body: { read: true } }),
      invalidatesTags: ["Website"],
    }),
    getSyllabus: build.query<Envelope<unknown[]>, string>({
      query: (classId) => `/website/syllabus?classId=${classId}`,
      providesTags: ["Website"],
    }),
    saveSyllabus: build.mutation<Envelope<unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/website/syllabus", method: "PUT", body }),
      invalidatesTags: ["Website"],
    }),
  }),
});

export const {
  useGetWebsiteQuery,
  useSaveWebsiteConfigMutation,
  useSaveWebsitePageMutation,
  useDeleteWebsitePageMutation,
  useSaveWebsitePostMutation,
  useDeleteWebsitePostMutation,
  useSaveWebsiteAlbumMutation,
  useDeleteWebsiteAlbumMutation,
  useSaveWebsiteMediaMutation,
  useDeleteWebsiteMediaMutation,
  useSaveWebsitePersonMutation,
  useDeleteWebsitePersonMutation,
  useSaveWebsiteFileMutation,
  useDeleteWebsiteFileMutation,
  useMarkWebsiteInquiryMutation,
  useGetSyllabusQuery,
  useSaveSyllabusMutation,
} = websiteApi;
