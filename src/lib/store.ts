import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import "./api/schoolApi";
import "./api/classApi";
import "./api/subjectApi";
import "./api/routineApi";
import "./api/workspaceApi";
import "./api/peopleApi";
import "./api/communicationApi";
import "./api/operationsApi";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
