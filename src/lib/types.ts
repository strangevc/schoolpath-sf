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
  tags: SchoolTags;
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
  matters: string[]; // selected chips
};

export type Tier = "strong" | "likely" | "stretch" | "unknown";

export type ProgramOdds = {
  tier: Tier;
  appliesTier: TierKey;
  pctSuccess: number | null;
  pctAssigned: number | null;
  requests: number;
  seats: number;
  /** Plain-english reason this tier was assigned to the user */
  why: string;
  /** Plain-english odds phrase, e.g. "47 applied for 22 spots last year. Families like you got in 62% of the time." */
  oddsPhrase: string;
};

export type ListItem = {
  schoolId: number;
  programCode: string;
  /** Computed tier for the user; cached for display */
  tier: Tier;
};
