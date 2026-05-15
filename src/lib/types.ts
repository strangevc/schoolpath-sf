export type Grade = "TK" | "K";

export type TierKey = "all" | "sibling" | "esaa" | "msf" | "ctip1" | "none";

export type TierStats = {
  requests: number;
  assigned: number;
  pctAssigned: number | null;
  assignedHigherOrEqual: number;
  pctSuccess: number | null;
};

export type RankBreakdown = {
  rank: number;
  tiebreakers: string;
  requests: number;
  assignedHere: number;
  assignedBetter: number;
  assignedWorse: number;
};

export type SchoolProgram = {
  idSchool: number;
  schoolName: string;
  grade: string;
  pathway: string;
  programName: string;
  feedsTo?: number;
  tiers: Record<TierKey, TierStats>;
  ranks: RankBreakdown[];
};

export type SchoolTags = {
  schoolType: "ES" | "K8" | "EarlyEd" | "Other";
  languages: string[];
  specialEd: string[];
  hasGeneralEd: boolean;
};

export type School = {
  idSchool: number;
  name: string;
  shortName: string;
  tkPrograms: SchoolProgram[];
  kPrograms: SchoolProgram[];
  totalSeats: { TK: number; K: number };
  coords?: { lat: number; lng: number } | null;
  address?: string;
  neighborhood?: string;
  website?: string;
  phone?: string;
  /** URL of the SFUSD school detail page */
  sfusdUrl?: string;
  tags: SchoolTags;
};

export type FilterPrefs = {
  languages: string[];
  schoolTypes: string[];
  neighborhoods: string[];
  maxDistanceMi: number | null;
};

export type Situation = {
  address?: string;
  lat?: number;
  lng?: number;
  grade: Grade;
  /** id of attendance area elementary school, if known */
  aaSchoolId?: number;
  isCTIP1?: boolean;
  /** id of school where a sibling currently attends */
  siblingSchoolId?: number;
  /** id of the current PreK/TK site, if any */
  prekSiteId?: number;
  prekProgramCode?: string;
  /** Filter preferences carried from intake to the builder */
  prefs?: FilterPrefs;
};

export type Tier = "strong" | "likely" | "stretch" | "unknown";

export type ProgramOdds = {
  tier: Tier;
  appliesTier: TierKey;
  pctSuccess: number | null;
  pctAssigned: number | null;
  /** Applicants in the user's tier (annual avg) */
  tierRequests: number;
  /** Admits in the user's tier (annual avg) */
  tierAssigned: number;
  /** Total program admits per year across all tiebreakers (≈ seats) */
  totalSeats: number;
  /** Plain-english reason this tier was assigned to the user */
  why: string;
  /** Compact stat line: "~25 seats/yr · 20 applicants in your tier · 4-yr avg" */
  statsLine: string;
  /** Short explainer of what % means */
  summary: string;
};

export type ListItem = {
  schoolId: number;
  programCode: string;
  /** Computed tier for the user; cached for display */
  tier: Tier;
};
