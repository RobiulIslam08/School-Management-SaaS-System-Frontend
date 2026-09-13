export type Role = "platform_owner" | "school_admin" | "teacher" | "accountant" | "guardian";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
  totpEnabled?: boolean;
}

export interface SchoolSettings {
  name: string;
  logoUrl: string;
  address: string;
  eiin: string;
  establishedYear: number | null;
  motto: string;
  theme: { primary: string; radius: string };
  academicYear: string;
  smsApiKey?: string;
  defaultLanguage: "bn" | "en";
}

export type FeatureMap = Record<string, boolean>;

export interface SessionPayload {
  user: ApiUser;
  settings: SchoolSettings;
  features: FeatureMap;
}
