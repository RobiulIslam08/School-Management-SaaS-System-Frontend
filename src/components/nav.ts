export interface NavItem {
  href: string;
  labelKey:
    | "dashboard"
    | "classes"
    | "subjects"
    | "attendance"
    | "exams"
    | "results"
    | "marksheets"
    | "students"
    | "admit"
    | "teachers"
    | "staff"
    | "fees"
    | "feeDues"
    | "feeCollected"
    | "payroll"
    | "notices"
    | "sms"
    | "talent"
    | "reports"
    | "library"
    | "transport"
    | "hostel"
    | "idCards"
    | "certificates"
    | "guardian"
    | "teacherPortal"
    | "settings";
  feature?: string;
  roles?: string[];
}

export interface NavGroup {
  titleKey: "overview" | "academic" | "people" | "finance" | "communication" | "operations" | "portals" | "system";
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: "overview",
    items: [{ href: "/dashboard", labelKey: "dashboard" }],
  },
  {
    titleKey: "academic",
    items: [
      { href: "/classes", labelKey: "classes", feature: "academics" },
      { href: "/subjects", labelKey: "subjects", feature: "academics" },
      { href: "/attendance", labelKey: "attendance", feature: "attendance" },
      { href: "/exams", labelKey: "exams", feature: "exams" },
      { href: "/results", labelKey: "results", feature: "results" },
      { href: "/marksheets", labelKey: "marksheets", feature: "results" },
      { href: "/certificates", labelKey: "certificates", feature: "certificates" },
    ],
  },
  {
    titleKey: "people",
    items: [
      { href: "/students", labelKey: "students", feature: "students" },
      { href: "/students/admit", labelKey: "admit", feature: "admission" },
      { href: "/teachers", labelKey: "teachers", feature: "teachers" },
      { href: "/staff", labelKey: "staff" },
    ],
  },
  {
    titleKey: "finance",
    items: [
      { href: "/fees/dues", labelKey: "feeDues", feature: "fees" },
      { href: "/fees/collected", labelKey: "feeCollected", feature: "fees" },
      { href: "/payroll", labelKey: "payroll", feature: "payroll" },
    ],
  },
  {
    titleKey: "communication",
    items: [
      { href: "/notices", labelKey: "notices", feature: "notices" },
      { href: "/sms", labelKey: "sms", feature: "sms" },
    ],
  },
  {
    titleKey: "operations",
    items: [
      { href: "/talent", labelKey: "talent", feature: "talent" },
      { href: "/reports/areas", labelKey: "reports", feature: "reports" },
      { href: "/library", labelKey: "library", feature: "library" },
      { href: "/transport", labelKey: "transport", feature: "transport" },
      { href: "/hostel", labelKey: "hostel", feature: "hostel" },
      { href: "/id-cards", labelKey: "idCards", feature: "idCards" },
    ],
  },
  {
    titleKey: "portals",
    items: [
      { href: "/portal/guardian", labelKey: "guardian" },
      { href: "/portal/teacher", labelKey: "teacherPortal" },
    ],
  },
  {
    titleKey: "system",
    items: [{ href: "/settings", labelKey: "settings", feature: "settings" }],
  },
];
