import type { AppDispatch } from "@/lib/store";
import { baseApi } from "@/lib/api/baseApi";

/** Warm RTK cache when the user hovers a sidebar link. */
export function prefetchNav(dispatch: AppDispatch, href: string): void {
  const path = href.split("?")[0];
  const run = (endpoint: string, arg: unknown = undefined) => {
    dispatch(baseApi.util.prefetch(endpoint as never, arg as never, { force: false }));
  };

  switch (path) {
    case "/dashboard":
      run("getDashboard");
      break;
    case "/students":
      run("getStudents", {});
      run("getClasses");
      break;
    case "/teachers":
      run("getTeachers");
      run("getSubjects");
      break;
    case "/classes":
      run("getClasses");
      break;
    case "/subjects":
      run("getSubjects");
      break;
    case "/notices":
      run("getNotices", {});
      run("getClasses");
      break;
    case "/fees/dues":
      run("getFeeSummary");
      run("getLedgers");
      break;
    case "/fees/collected":
      run("getFeeSummary");
      run("getLedgers");
      break;
    case "/exams":
      run("getExams");
      break;
    case "/results":
      run("getExams");
      run("getClasses");
      break;
    case "/expenses": {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      run("getExpenses", { year, month });
      break;
    }
    default:
      break;
  }
}
