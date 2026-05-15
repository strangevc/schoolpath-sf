import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { parse } from "csv-parse/sync";
import * as shapefile from "shapefile";

const ROOT = resolve(__dirname, "..");
const RAW = resolve(ROOT, "data/raw");
const OUT = resolve(ROOT, "src/data/build");

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

type Pct = number | null;
const parsePct = (v: string): Pct => {
  if (!v || v === "-" || v.trim() === "") return null;
  const n = parseFloat(v.replace("%", ""));
  return Number.isFinite(n) ? n / 100 : null;
};
const parseNum = (v: string): number => {
  if (!v || v === "-" || v.trim() === "") return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

type TierKey = "all" | "sibling" | "esaa" | "msf" | "ctip1" | "none";
type TierStats = {
  requests: number;
  assigned: number;
  pctAssigned: Pct;
  assignedHigherOrEqual: number;
  pctSuccess: Pct;
};
type ProgramRow = {
  idSchool: number;
  schoolName: string;
  grade: string;
  pathway: string;
  programName: string;
  tiers: Record<TierKey, TierStats>;
  /** For TK feeder programs, the destination K school idSchool parsed from the pathway code */
  feedsTo?: number;
};

// --- success_rates.csv ---
const successCsv = readFileSync(resolve(RAW, "success_rates.csv"), "utf8");
// File has a 2-row banner + header. Parse as arrays first, drop row 0 (category
// banner that contains embedded newlines inside quoted cells), then map row 1
// as header, rest as data.
const rawArr = parse(successCsv, {
  skip_empty_lines: true,
  relax_column_count: true,
}) as string[][];
const headers = rawArr[1];
const rows: Record<string, string>[] = rawArr
  .slice(2)
  .filter((r) => r.some((c) => c && c.trim()))
  .map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = r[i] ?? ""));
    return obj;
  });

const programs: ProgramRow[] = rows
  .filter((r) => r.idSchool && r.SchoolName && r.Grade)
  .map((r) => {
    const pathway = (r.Pathway || "").trim();
    // TK feeder codes embed destination idSchool, e.g. "GE479" → 479
    const feedMatch = pathway.match(/^(GE|SE|SN)(\d{3,4})$/);
    return {
      idSchool: Number(r.idSchool),
      schoolName: r.SchoolName.trim(),
      grade: r.Grade.trim(),
      pathway,
      programName: (r["Program Name"] || "").trim(),
      feedsTo: feedMatch ? Number(feedMatch[2]) : undefined,
      tiers: {
        all: {
          requests: parseNum(r.Requests),
          assigned: parseNum(r["Assigned students"]),
          pctAssigned: parsePct(r["% assigned"]),
          assignedHigherOrEqual: parseNum(
            r["# assigned to this or higher-ranked choice"]
          ),
          pctSuccess: parsePct(r["% success"]),
        },
        sibling: {
          requests: parseNum(r["Requests with Sibling tiebreaker"]),
          assigned: parseNum(r["Assigned with Sibling tiebreaker"]),
          pctAssigned: parsePct(r["Sib % assigned"]),
          assignedHigherOrEqual: parseNum(
            r["Sib # assigned to this or higher-ranked choice"]
          ),
          pctSuccess: parsePct(r["Sib % success"]),
        },
        esaa: {
          requests: parseNum(r["Requests with ESAA tiebreaker"]),
          assigned: parseNum(r["Assigned with ESAA tiebreaker"]),
          pctAssigned: parsePct(r["ESAA % assigned"]),
          assignedHigherOrEqual: parseNum(
            r["ESAA # assigned to this or higher-ranked choice"]
          ),
          pctSuccess: parsePct(r["ESAA % success"]),
        },
        msf: {
          requests: parseNum(r["Requests with MSF tiebreaker"]),
          assigned: parseNum(r["Assigned with MSF tiebreaker"]),
          pctAssigned: parsePct(r["MSF % assigned"]),
          assignedHigherOrEqual: parseNum(
            r["MSF # assigned to this or higher-ranked choice"]
          ),
          pctSuccess: parsePct(r["MSF % success"]),
        },
        ctip1: {
          requests: parseNum(r["CTIP1 Applicants"]),
          assigned: parseNum(r["CTIP1 # assigned"]),
          pctAssigned: parsePct(r["CTIP1 % assigned"]),
          assignedHigherOrEqual: parseNum(
            r["CTIP1 # assigned to this or higher-ranked choice"]
          ),
          pctSuccess: parsePct(r["CTIP1 % success"]),
        },
        none: {
          requests: parseNum(r["Requests with no tiebreaker"]),
          assigned: parseNum(r["Assigned with no tiebreaker"]),
          pctAssigned: parsePct(r["No tiebreaker % assigned"]),
          assignedHigherOrEqual: parseNum(
            r["No tiebreaker # assigned to this or higher-ranked choice"]
          ),
          pctSuccess: parsePct(r["No tiebreaker % success"]),
        },
      },
    };
  });

// --- assignment_designations.csv (seats by school × grade) ---
const designCsv = readFileSync(
  resolve(RAW, "assignment_designations.csv"),
  "utf8"
);
const designRows = parse(designCsv, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
}) as Record<string, string>[];

const seatsBySchoolGrade = new Map<string, Record<string, number>>();
designRows.forEach((r) => {
  const name = (r.SchoolName || "").trim();
  if (!name || name === "Grand Total") return;
  seatsBySchoolGrade.set(name, {
    TK: parseNum(r.TK),
    K: parseNum(r.K),
    "6": parseNum(r["6"]),
    "9": parseNum(r["9"]),
  });
});

// --- applicant_counts.csv (rank breakdown) ---
const countsCsv = readFileSync(resolve(RAW, "applicant_counts.csv"), "utf8");
const countRows = parse(countsCsv, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
}) as Record<string, string>[];

type RankBreakdown = {
  rank: number;
  tiebreakers: string;
  requests: number;
  assignedHere: number;
  assignedBetter: number;
  assignedWorse: number;
};
const rankByKey = new Map<string, RankBreakdown[]>();
countRows.forEach((r) => {
  const key = `${r.idSchool}|${r.Grade}|${r.ProgramCode}`;
  const list = rankByKey.get(key) ?? [];
  list.push({
    rank: parseInt(r.Rank, 10),
    tiebreakers: (r.Tiebreakers || "").trim(),
    requests: parseNum(r.Requests),
    assignedHere: parseNum(r["Assigned Here"]),
    assignedBetter: parseNum(r["Assigned Better"]),
    assignedWorse: parseNum(r["Assigned Worse"]),
  });
  rankByKey.set(key, list);
});

// --- Group into Schools ---
type SchoolProgram = ProgramRow & {
  ranks: RankBreakdown[];
};
type School = {
  idSchool: number;
  name: string;
  shortName: string; // friendly display
  /** TK programs available at this school (may be feeder slots) */
  tkPrograms: SchoolProgram[];
  /** K programs at this school */
  kPrograms: SchoolProgram[];
  totalSeats: { TK: number; K: number };
};

const schoolMap = new Map<number, School>();
const shortName = (n: string) =>
  n
    .replace(/\(([^)]+)\)/g, "($1)")
    .replace(/\s+EES$/, " (Early Ed)")
    .replace(/\s+ES$/, "")
    .replace(/\s+K-8$/, " (K-8)")
    .replace(/\s+HS$/, "")
    .replace(/\s+MS$/, "");

programs.forEach((p) => {
  if (p.grade !== "TK" && p.grade !== "K") return;
  if (!schoolMap.has(p.idSchool)) {
    const seats = seatsBySchoolGrade.get(p.schoolName) ?? { TK: 0, K: 0 };
    schoolMap.set(p.idSchool, {
      idSchool: p.idSchool,
      name: p.schoolName,
      shortName: shortName(p.schoolName),
      tkPrograms: [],
      kPrograms: [],
      totalSeats: { TK: seats.TK ?? 0, K: seats.K ?? 0 },
    });
  }
  const sch = schoolMap.get(p.idSchool)!;
  const key = `${p.idSchool}|${p.grade}|${p.pathway}`;
  const ranks = rankByKey.get(key) ?? [];
  const sp: SchoolProgram = { ...p, ranks };
  if (p.grade === "TK") sch.tkPrograms.push(sp);
  else sch.kPrograms.push(sp);
});

const schools = Array.from(schoolMap.values()).sort((a, b) =>
  a.name.localeCompare(b.name)
);

// --- TK feeder map: TK Early Ed program → destination K school idSchool ---
const tkFeeders: Record<string, number> = {};
schools.forEach((s) => {
  s.tkPrograms.forEach((p) => {
    if (p.feedsTo) tkFeeders[`${p.idSchool}|${p.pathway}`] = p.feedsTo;
  });
});

writeFileSync(resolve(OUT, "schools.json"), JSON.stringify(schools, null, 2));
writeFileSync(
  resolve(OUT, "tk_feeders.json"),
  JSON.stringify(tkFeeders, null, 2)
);

console.log(
  `Wrote ${schools.length} schools with TK or K programs to schools.json`
);
console.log(`Wrote ${Object.keys(tkFeeders).length} TK feeder mappings`);

// --- CTIP1 shapefile → GeoJSON ---
(async () => {
  const ctipDir = resolve(RAW, "ctip1_shapefile");
  const shp = resolve(ctipDir, "ctip1_2014.shp");
  const dbf = resolve(ctipDir, "ctip1_2014.dbf");
  if (existsSync(shp)) {
    const features: GeoJSON.Feature[] = [];
    const source = await shapefile.open(shp, dbf);
    let result = await source.read();
    while (!result.done) {
      features.push(result.value as GeoJSON.Feature);
      result = await source.read();
    }
    const geo: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };
    writeFileSync(resolve(OUT, "ctip1.json"), JSON.stringify(geo));
    console.log(`Wrote CTIP1 GeoJSON: ${features.length} features`);
  } else {
    console.warn("CTIP1 shapefile not found at " + shp);
  }

  // AA shapefile — look for it under data/raw/aa_shapefile/*.shp (drop in if available)
  const aaDir = resolve(RAW, "aa_shapefile");
  if (existsSync(aaDir)) {
    const fs = await import("node:fs");
    const files = fs.readdirSync(aaDir);
    const shpFile = files.find((f) => f.toLowerCase().endsWith(".shp"));
    if (shpFile) {
      const aaShp = resolve(aaDir, shpFile);
      const aaDbf = resolve(aaDir, shpFile.replace(/\.shp$/i, ".dbf"));
      const features: GeoJSON.Feature[] = [];
      const source = await shapefile.open(aaShp, existsSync(aaDbf) ? aaDbf : undefined);
      let result = await source.read();
      while (!result.done) {
        features.push(result.value as GeoJSON.Feature);
        result = await source.read();
      }
      const geo: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features,
      };
      writeFileSync(resolve(OUT, "aa.json"), JSON.stringify(geo));
      console.log(`Wrote AA GeoJSON: ${features.length} features`);
    }
  } else {
    console.warn(
      "AA shapefile dir not found at " +
        aaDir +
        " — drop the .shp/.shx/.dbf in data/raw/aa_shapefile/ and rerun"
    );
  }
})();
