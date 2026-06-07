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
  status: "published" | "draft";
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
