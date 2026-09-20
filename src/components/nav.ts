export interface NavItem {
  href: string;
  labelKey:
    | "dashboard"
    | "classes"
    | "subjects"
    | "attendance"
    | "staffAttendance"
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
    | "expenses"
    | "donations"
    | "accounts"
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
  /** Required permission (e.g. fees:view). Omit for all authenticated school users. */
  permission?: string;
  /** If set, only these roles see the item (in addition to permission/feature). */
  roles?: string[];
}

export interface NavGroup {
  titleKey: "overview" | "academic" | "people" | "finance" | "communication" | "operations" | "portals" | "system";
  items: NavItem[];
}

export function canAccess(permissions: string[], needed?: string): boolean {
  if (!needed) return true;
  if (permissions.includes(needed)) return true;
  const [mod] = needed.split(":");
  return permissions.includes(`${mod}:*`);
}

export const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: "overview",
    items: [
      { href: "/dashboard", labelKey: "dashboard" },
      { href: "/students/admit", labelKey: "admit", feature: "admission", permission: "admission:view" },
    ],
  },
  {
    titleKey: "academic",
    items: [
      { href: "/classes", labelKey: "classes", feature: "academics", permission: "academics:view" },
      { href: "/subjects", labelKey: "subjects", feature: "academics", permission: "academics:view" },
      { href: "/attendance", labelKey: "attendance", feature: "attendance", permission: "attendance:view" },
      {
        href: "/staff-attendance",
        labelKey: "staffAttendance",
        feature: "staffAttendance",
        permission: "staffAttendance:view",
      },
      { href: "/exams", labelKey: "exams", feature: "exams", permission: "exams:view" },
      { href: "/results", labelKey: "results", feature: "results", permission: "results:view" },
      { href: "/marksheets", labelKey: "marksheets", feature: "results", permission: "results:view" },
      {
        href: "/certificates",
        labelKey: "certificates",
        feature: "certificates",
        permission: "certificates:view",
      },
    ],
  },
  {
    titleKey: "people",
    items: [
      { href: "/students", labelKey: "students", feature: "students", permission: "students:view" },
      { href: "/teachers", labelKey: "teachers", feature: "teachers", permission: "teachers:view" },
      { href: "/staff", labelKey: "staff", permission: "users:view" },
    ],
  },
  {
    titleKey: "finance",
    items: [
      { href: "/fees/dues", labelKey: "feeDues", feature: "fees", permission: "fees:view" },
      { href: "/fees/collected", labelKey: "feeCollected", feature: "fees", permission: "fees:view" },
      { href: "/payroll", labelKey: "payroll", feature: "payroll", permission: "payroll:view" },
      { href: "/expenses", labelKey: "expenses", feature: "expenses", permission: "expenses:view" },
      { href: "/donations", labelKey: "donations", feature: "donations", permission: "donations:view" },
      { href: "/accounts", labelKey: "accounts", feature: "accounts", permission: "accounts:view" },
    ],
  },
  {
    titleKey: "communication",
    items: [
      { href: "/notices", labelKey: "notices", feature: "notices", permission: "notices:view" },
      { href: "/sms", labelKey: "sms", feature: "sms", permission: "sms:view" },
    ],
  },
  {
    titleKey: "operations",
    items: [
      { href: "/talent", labelKey: "talent", feature: "talent", permission: "talent:view" },
      { href: "/reports/areas", labelKey: "reports", feature: "reports", permission: "reports:view" },
      { href: "/library", labelKey: "library", feature: "library", permission: "library:view" },
      { href: "/transport", labelKey: "transport", feature: "transport", permission: "transport:view" },
      { href: "/hostel", labelKey: "hostel", feature: "hostel", permission: "hostel:view" },
      { href: "/id-cards", labelKey: "idCards", feature: "idCards", permission: "idCards:view" },
    ],
  },
  {
    titleKey: "portals",
    items: [
      { href: "/portal/guardian", labelKey: "guardian", roles: ["guardian"] },
      { href: "/portal/teacher", labelKey: "teacherPortal", roles: ["teacher", "school_admin"] },
    ],
  },
  {
    titleKey: "system",
    items: [{ href: "/settings", labelKey: "settings", feature: "settings", permission: "settings:view" }],
  },
];
