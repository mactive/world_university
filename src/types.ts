export type RegionCode = "US" | "CA" | "UK" | "AU" | "SG" | "HK";

export interface SourceLink {
  label: string;
  url: string;
  year?: number;
}

export interface AdmissionYear {
  year: number;
  applicants?: number;
  admitted?: number;
  enrolled?: number;
  acceptanceRate?: number;
  mainlandChinaAdmitted?: number;
  source?: string;
}

export interface University {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  abbreviation: string;
  country: string;
  countryCode: RegionCode;
  city: string;
  latitude: number;
  longitude: number;
  qsRank?: number;
  rankYear?: number;
  rankingSystem?: "QS" | "U.S. News";
  enrollment?: number;
  website: string;
  admissionsUrl: string;
  tuition?: {
    amount: number;
    currency: string;
    period: "year" | "semester";
    year: number;
    source?: string;
  };
  mainlandChinaIntake?: {
    count?: number;
    year: number;
    note: string;
    source?: string;
  };
  strengths: string[];
  housing?: {
    min: number;
    max: number;
    currency: string;
    period: "month" | "year";
    year: number;
    source?: string;
  };
  requirements: {
    summary: string;
    standardized: string;
    ap: string;
    competitions: string;
    language: string;
    source?: string;
    year: number;
  };
  admissionHistory: AdmissionYear[];
  sources: SourceLink[];
  tags: string[];
  status: "published" | "draft";
  updatedAt: string;
}

export interface MainlandSchool {
  id: string;
  nameZh: string;
  nameEn: string;
  province: string;
  city: string;
  schoolType: string;
  website: string;
  notes: string;
  tags: string[];
  status: "active" | "archived";
  updatedAt: string;
}

export type OfferSourceKind = "screenshot" | "official" | "api" | "manual";

export interface UniversityOfferRecord {
  id: string;
  year: number;
  universityId: string;
  universityNameZh?: string;
  universityNameEn?: string;
  mainlandSchoolId?: string;
  mainlandSchoolNameZh?: string;
  offerCount: number;
  applicantCount?: number;
  enrolledCount?: number;
  degreeLevel: "undergraduate" | "graduate" | "foundation" | "other";
  sourceName: string;
  sourceUrl?: string;
  sourceSnapshot?: string;
  sourceKind: OfferSourceKind;
  filters: Record<string, string>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface UniversityAlias {
  alias: string;
  universityId: string;
  universityNameZh?: string;
  universityNameEn?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const REGION_LABELS: Record<RegionCode, string> = {
  US: "美国",
  CA: "加拿大",
  UK: "英国",
  AU: "澳大利亚",
  SG: "新加坡",
  HK: "中国香港",
};
