import type {
  Grade,
  ProgramOdds,
  School,
  SchoolProgram,
  Situation,
  Tier,
  TierKey,
  TierStats,
} from "./types";

const THRESHOLDS = {
  strong: 0.6, // ≥60% admitted in user's tiebreaker tier → "Likely"
  likely: 0.3, // 30–60% → "Possible"; below 30% → "Competitive"
};

/**
 * Decide which tiebreaker tier *this user* applies under, for *this program*.
 * Order of strength roughly matches SFUSD's tiebreaker priority:
 *   sibling > esaa (attendance area) > ctip1 > none
 * MSF is middle-school only and irrelevant for TK/K.
 */
export function userTierFor(
  situation: Situation,
  school: School,
  program: SchoolProgram
): TierKey {
  // Sibling at this school?
  if (situation.siblingSchoolId === school.idSchool) return "sibling";

  // Attendance Area (elementary only, K & TK at elementary)
  if (situation.aaSchoolId === school.idSchool && school.kPrograms.length > 0)
    return "esaa";

  if (situation.isCTIP1) return "ctip1";

  return "none";
}

/**
 * Returns the most usable tier stats for the user. If their natural tier has
 * no observed applicants (small-sample-size problem), fall back through
 * none → all so we still have a number to show.
 */
function statsForUser(
  program: SchoolProgram,
  userTier: TierKey
): { tier: TierKey; stats: TierStats } {
  const order: TierKey[] = [userTier, "none", "all"];
  for (const t of order) {
    const s = program.tiers[t];
    if (s && s.requests > 0 && s.pctSuccess !== null) {
      return { tier: t, stats: s };
    }
  }
  return { tier: "all", stats: program.tiers.all };
}

export function tierFromSuccess(pct: number | null): Tier {
  if (pct === null) return "unknown";
  if (pct >= THRESHOLDS.strong) return "strong";
  if (pct >= THRESHOLDS.likely) return "likely";
  return "stretch";
}

const TIER_LABEL: Record<TierKey, string> = {
  sibling: "you have a sibling enrolled here",
  esaa: "this is your attendance area school",
  msf: "you have feeder priority",
  ctip1: "your address is in a CTIP1 area",
  none: "no tiebreakers apply",
  all: "based on all applicants",
};

function fmtPct(p: number | null): string {
  if (p === null) return "—";
  return `${Math.round(p * 100)}%`;
}

function buildStatsLine(
  p: SchoolProgram,
  stats: TierStats,
  grade: Grade
): { statsLine: string; summary: string } {
  const tierReqs = Math.round(stats.requests);
  const totalSeats = Math.round(p.tiers.all.assigned || 0);
  if (tierReqs === 0 && totalSeats === 0) {
    return {
      statsLine: "",
      summary: "Too few past applicants to estimate placement.",
    };
  }

  const parts: string[] = [];
  if (totalSeats > 0) parts.push(`${totalSeats} seats / yr`);
  if (tierReqs > 0) parts.push(`${tierReqs} applicants in your tier`);
  parts.push("4-yr avg");
  const statsLine = parts.join(" · ");

  const summary =
    stats.pctSuccess !== null
      ? `got this school, or a school they preferred more.`
      : `Not enough recent applicants to estimate placement.`;

  return { statsLine, summary };
}

export function oddsFor(
  situation: Situation,
  school: School,
  program: SchoolProgram
): ProgramOdds {
  const ut = userTierFor(situation, school, program);
  const { tier, stats } = statsForUser(program, ut);
  const why = TIER_LABEL[ut];
  const { statsLine, summary } = buildStatsLine(
    program,
    stats,
    situation.grade
  );
  return {
    tier: tierFromSuccess(stats.pctSuccess),
    appliesTier: tier,
    pctSuccess: stats.pctSuccess,
    pctAssigned: stats.pctAssigned,
    tierRequests: stats.requests,
    tierAssigned: stats.assigned,
    totalSeats: Math.round(program.tiers.all.assigned || 0),
    why,
    statsLine,
    summary,
  };
}

/**
 * Best (highest-tier) program offered at a school for the user's situation
 * and grade. Used to decide a single tier for school cards/pins.
 */
export function bestProgramFor(
  situation: Situation,
  school: School
): { program: SchoolProgram; odds: ProgramOdds } | null {
  const list =
    situation.grade === "TK" ? school.tkPrograms : school.kPrograms;
  if (!list.length) return null;
  // Prefer matching what user is currently in (immersion continuity); else GE
  const ge = list.find((p) => p.pathway === "GE" || /^GE\d/.test(p.pathway));
  const candidates = ge ? [ge, ...list.filter((p) => p !== ge)] : list;
  let best: { program: SchoolProgram; odds: ProgramOdds } | null = null;
  for (const p of candidates) {
    const o = oddsFor(situation, school, p);
    if (
      !best ||
      tierRank(o.tier) > tierRank(best.odds.tier) ||
      ((o.pctSuccess ?? 0) > (best.odds.pctSuccess ?? 0) &&
        o.tier === best.odds.tier)
    ) {
      best = { program: p, odds: o };
    }
  }
  return best;
}

function tierRank(t: Tier): number {
  return t === "strong" ? 3 : t === "likely" ? 2 : t === "stretch" ? 1 : 0;
}

export const TIER_COPY: Record<Tier, { label: string; sub: string }> = {
  strong: {
    label: "Likely",
    sub: "60% or more of applicants in your tiebreaker category were admitted.",
  },
  likely: {
    label: "Possible",
    sub: "Between 30% and 60% of similar applicants were admitted.",
  },
  stretch: {
    label: "Competitive",
    sub: "Fewer than 30% of similar applicants were admitted. Demand exceeds seats.",
  },
  unknown: {
    label: "Not enough data",
    sub: "Too few past applicants to estimate placement.",
  },
};
