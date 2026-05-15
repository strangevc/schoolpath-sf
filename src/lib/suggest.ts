import { SCHOOLS } from "./data";
import { bestProgramFor } from "./tier";
import type { ListItem, School, Situation, Tier } from "./types";

// Haversine distance in miles between two coords.
export function milesBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export type Candidate = {
  school: School;
  programCode: string;
  programName: string;
  tier: Tier;
  pctSuccess: number | null;
  distanceMi: number | null;
  reason: string;
};

const TARGET_BY_TIER: Record<"strong" | "likely" | "stretch", number> = {
  strong: 5,
  likely: 8,
  stretch: 5,
};

type GapTier = "strong" | "likely" | "stretch";

/**
 * Given the user's current ranking, pick the tier that's most underweighted
 * relative to a balanced 5/8/5 = 18-school list.
 */
export function mostUnderweightedTier(
  counts: Record<Tier, number>
): GapTier | null {
  const deficits: { tier: GapTier; deficit: number }[] = [
    { tier: "strong", deficit: TARGET_BY_TIER.strong - counts.strong },
    { tier: "likely", deficit: TARGET_BY_TIER.likely - counts.likely },
    { tier: "stretch", deficit: TARGET_BY_TIER.stretch - counts.stretch },
  ];
  deficits.sort((a, b) => b.deficit - a.deficit);
  return deficits[0].deficit > 0 ? deficits[0].tier : null;
}

/**
 * Build the candidate list for the user (every school with a program in the
 * user's grade), with computed tier and distance. When intake prefs are set,
 * filters candidates by OR-across-groups (matches the drawer's filter logic):
 * a school passes if it satisfies at least one active pref group.
 */
export function candidatesFor(situation: Situation): Candidate[] {
  const home = situation.lat && situation.lng
    ? { lat: situation.lat, lng: situation.lng }
    : null;
  const prefs = situation.prefs;
  const anyPrefActive =
    !!prefs &&
    (prefs.languages.length > 0 ||
      prefs.schoolTypes.length > 0 ||
      prefs.neighborhoods.length > 0 ||
      prefs.maxDistanceMi != null);

  return SCHOOLS.flatMap((school) => {
    const list =
      situation.grade === "TK" ? school.tkPrograms : school.kPrograms;
    if (!list.length) return [];
    const best = bestProgramFor(situation, school);
    if (!best) return [];
    const distanceMi =
      home && school.coords ? milesBetween(home, school.coords) : null;

    // Apply intake prefs as OR across groups. Always include the user's AA
    // school and sibling-linked school regardless of prefs — those are
    // structural to a healthy ranking.
    const isAnchor =
      school.idSchool === situation.aaSchoolId ||
      school.idSchool === situation.siblingSchoolId;
    if (anyPrefActive && !isAnchor && prefs) {
      const langMatch =
        prefs.languages.length > 0 &&
        school.tags.languages.some((l) => prefs.languages.includes(l));
      const typeMatch =
        prefs.schoolTypes.length > 0 &&
        prefs.schoolTypes.includes(school.tags.schoolType);
      const neighMatch =
        prefs.neighborhoods.length > 0 &&
        prefs.neighborhoods.includes(school.neighborhood || "");
      const distMatch =
        prefs.maxDistanceMi != null &&
        distanceMi != null &&
        distanceMi <= prefs.maxDistanceMi;
      if (!langMatch && !typeMatch && !neighMatch && !distMatch) return [];
    }

    let reason = "";
    if (best.odds.tier === "strong") reason = "Likely placement for your situation";
    else if (best.odds.tier === "likely") reason = "Possible placement";
    else if (best.odds.tier === "stretch") reason = "Competitive";
    return [
      {
        school,
        programCode: best.program.pathway,
        programName: best.program.programName,
        tier: best.odds.tier,
        pctSuccess: best.odds.pctSuccess,
        distanceMi,
        reason,
      },
    ];
  });
}

/**
 * Suggest the next 5 schools to add. Prefers the most underweighted tier
 * relative to a 5/8/5 target, sorted by success rate (desc) and distance.
 */
export function suggestNextAdds(
  situation: Situation,
  list: ListItem[],
  counts: Record<Tier, number>,
  limit = 5
): Candidate[] {
  const target = mostUnderweightedTier(counts) ?? "strong";
  const onList = new Set(list.map((l) => l.schoolId));
  const all = candidatesFor(situation).filter(
    (c) => !onList.has(c.school.idSchool)
  );
  // First try to fill the most underweighted tier
  const primary = all
    .filter((c) => c.tier === target)
    .sort((a, b) => {
      const da = a.distanceMi ?? Number.POSITIVE_INFINITY;
      const db = b.distanceMi ?? Number.POSITIVE_INFINITY;
      const ps = (b.pctSuccess ?? 0) - (a.pctSuccess ?? 0);
      if (Math.abs(ps) > 0.01) return ps;
      return da - db;
    });
  if (primary.length >= limit) return primary.slice(0, limit);
  // Otherwise mix in the next-best tier
  const fallback = all
    .filter((c) => c.tier !== target && c.tier !== "unknown")
    .sort((a, b) => {
      const rank = (t: Tier) => (t === "strong" ? 0 : t === "likely" ? 1 : 2);
      const r = rank(a.tier) - rank(b.tier);
      if (r) return r;
      return (b.pctSuccess ?? 0) - (a.pctSuccess ?? 0);
    });
  return [...primary, ...fallback].slice(0, limit);
}
