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
  /** Approximate centroid (from AA polygon when available). null for citywide-only schools */
  coords?: { lat: number; lng: number } | null;
  /** Derived tags for filtering */
  tags: {
    schoolType: "ES" | "K8" | "EarlyEd" | "Other";
    languages: string[]; // e.g. ["Cantonese Immersion", "Mandarin Immersion"]
    specialEd: string[]; // e.g. ["Autism Focus", "Mild/Moderate"]
    hasGeneralEd: boolean;
  };
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

// --- schools_directory.csv → coordinates + neighborhoods + addresses ---
type DirectoryRow = {
  coords: { lat: number; lng: number };
  address: string;
  neighborhood: string;
  website: string;
  phone: string;
};
const directory = new Map<string, DirectoryRow>();
const dirCsvPath = resolve(RAW, "schools_directory.csv");
if (existsSync(dirCsvPath)) {
  const dirCsv = readFileSync(dirCsvPath, "utf8");
  const dirRows = parse(dirCsv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  // Normalize a name for fuzzy matching against our success-rates names
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[().,]/g, "")
      .replace(/\b(elementary|school|academy|the|early education)\b/g, "")
      .replace(/\b(es|ees|hs|ms|k-?8)\b/g, "")
      .replace(/\bdr\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  for (const r of dirRows) {
    if (r.district !== "San Francisco Unified") continue;
    if (r.public_yesno !== "true") continue;
    if (r.status && r.status !== "Active") continue;
    const lat = parseFloat(r.latitude);
    const lng = parseFloat(r.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const key = norm(r.school || "");
    if (!key) continue;
    directory.set(key, {
      coords: { lat, lng },
      address: `${r.street_address || ""}, ${r.street_city || ""}, ${r.street_state || ""} ${r.street_zip || ""}`.trim(),
      neighborhood: r.analysis_neighborhood || "",
      website: r.website || "",
      phone: r.phone || "",
    });
  }
}

function lookupDirectory(name: string): DirectoryRow | undefined {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[():,.]/g, " ")
      .replace(/\b(elementary|school|academy|the|early education)\b/g, "")
      .replace(/\b(es|ees|hs|ms|k-?8|access sfusd|sfusd)\b/g, "")
      .replace(/\bdr\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const key = norm(name);
  if (directory.has(key)) return directory.get(key);
  // Try substring fallback
  for (const [k, v] of directory) {
    if (k.length > 4 && (key.includes(k) || k.includes(key))) return v;
  }
  return undefined;
}

function inferSchoolType(name: string): "ES" | "K8" | "EarlyEd" | "Other" {
  if (/K-8/i.test(name)) return "K8";
  if (/\bEES\b/.test(name) || /Early Ed/i.test(name)) return "EarlyEd";
  if (/\bES\b/.test(name)) return "ES";
  return "Other";
}

const LANG_BY_CODE: Record<string, string> = {
  CE: "Cantonese Immersion",
  CN: "Cantonese Immersion",
  CT: "Cantonese Immersion",
  CB: "Cantonese Biliteracy",
  JE: "Japanese Bilingual",
  JN: "Japanese Bilingual",
  KE: "Korean Immersion",
  KN: "Korean Immersion",
  ME: "Mandarin Immersion",
  MN: "Mandarin Immersion",
  SE: "Spanish Immersion",
  SN: "Spanish Immersion",
  SB: "Spanish Biliteracy",
  FB: "Filipino FLES",
};

const SPED_BY_CODE: Record<string, string> = {
  AF: "Autism Focus (SDC)",
  AO: "Auditory/Oral (SDC)",
  MM: "Mild to Moderate (SDC)",
  MS: "Extensive Support (SDC)",
  SA: "Sheltered (SDC)",
  BA: "Transition Program (SDC)",
  CA: "Transition Program (SDC)",
};

function tagsFor(progs: SchoolProgram[], name: string) {
  const languages = new Set<string>();
  const specialEd = new Set<string>();
  let hasGeneralEd = false;
  for (const p of progs) {
    const code = p.pathway.replace(/\d+$/, "");
    if (code === "GE") hasGeneralEd = true;
    if (LANG_BY_CODE[code]) languages.add(LANG_BY_CODE[code]);
    if (SPED_BY_CODE[code]) specialEd.add(SPED_BY_CODE[code]);
  }
  return {
    schoolType: inferSchoolType(name),
    languages: [...languages].sort(),
    specialEd: [...specialEd].sort(),
    hasGeneralEd,
  };
}

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
      coords: null,
      tags: { schoolType: "Other", languages: [], specialEd: [], hasGeneralEd: false },
    });
  }
  const sch = schoolMap.get(p.idSchool)!;
  const key = `${p.idSchool}|${p.grade}|${p.pathway}`;
  const ranks = rankByKey.get(key) ?? [];
  const sp: SchoolProgram = { ...p, ranks };
  if (p.grade === "TK") sch.tkPrograms.push(sp);
  else sch.kPrograms.push(sp);
});

const schools = Array.from(schoolMap.values())
  .map((s) => {
    const dir = lookupDirectory(s.name);
    return {
      ...s,
      tags: tagsFor([...s.tkPrograms, ...s.kPrograms], s.name),
      coords: dir?.coords ?? s.coords ?? null,
      address: dir?.address,
      neighborhood: dir?.neighborhood,
      website: dir?.website,
      phone: dir?.phone,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

// --- TK feeder map: TK Early Ed program → destination K school idSchool ---
const tkFeeders: Record<string, number> = {};
schools.forEach((s) => {
  s.tkPrograms.forEach((p) => {
    if (p.feedsTo) tkFeeders[`${p.idSchool}|${p.pathway}`] = p.feedsTo;
  });
});

// (centroids are attached later, after AA geojson is read)

console.log(
  `Wrote ${schools.length} schools with TK or K programs to schools.json`
);
console.log(`Wrote ${Object.keys(tkFeeders).length} TK feeder mappings`);

// --- CTIP1 shapefile → GeoJSON; AA → GeoJSON + attach centroids to schools ---
function polygonCentroid(geom: GeoJSON.Geometry): { lat: number; lng: number } | null {
  // Compute centroid by averaging all coordinate pairs of all polygon rings.
  // Good enough for "approximate school location" purposes.
  const pts: [number, number][] = [];
  const collect = (g: GeoJSON.Geometry) => {
    if (g.type === "Polygon")
      for (const ring of g.coordinates)
        for (const c of ring) pts.push([c[0], c[1]]);
    else if (g.type === "MultiPolygon")
      for (const poly of g.coordinates)
        for (const ring of poly) for (const c of ring) pts.push([c[0], c[1]]);
  };
  collect(geom);
  if (!pts.length) return null;
  const sumLng = pts.reduce((s, p) => s + p[0], 0);
  const sumLat = pts.reduce((s, p) => s + p[1], 0);
  return { lng: sumLng / pts.length, lat: sumLat / pts.length };
}

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

  // AA — first prefer a pre-fetched DataSF GeoJSON (data/raw/aa_datasf.geojson);
  // fall back to a shapefile under data/raw/aa_shapefile/*.shp.
  const aaGeoFile = resolve(RAW, "aa_datasf.geojson");
  const aaDir = resolve(RAW, "aa_shapefile");
  if (existsSync(aaGeoFile)) {
    const buf = readFileSync(aaGeoFile, "utf8");
    writeFileSync(resolve(OUT, "aa.json"), buf);
    const parsed = JSON.parse(buf) as GeoJSON.FeatureCollection;
    // Attach centroids to schools where AA matches by e_aa_schno
    for (const f of parsed.features) {
      const idRaw = (f.properties as Record<string, unknown> | null)?.e_aa_schno;
      const id =
        typeof idRaw === "string" ? parseInt(idRaw, 10) : typeof idRaw === "number" ? Math.round(idRaw) : null;
      if (!id || !f.geometry) continue;
      const sch = schools.find((s) => s.idSchool === id);
      // Only fill in centroid as fallback when directory lookup didn't supply coords
      if (sch && !sch.coords) sch.coords = polygonCentroid(f.geometry);
    }
    // Write schools.json AFTER attaching centroids
    writeFileSync(resolve(OUT, "schools.json"), JSON.stringify(schools, null, 2));
    writeFileSync(
      resolve(OUT, "tk_feeders.json"),
      JSON.stringify(tkFeeders, null, 2)
    );
    const withCoords = schools.filter((s) => s.coords).length;
    console.log(`Copied AA GeoJSON from DataSF: ${parsed.features.length} features. Attached centroids to ${withCoords}/${schools.length} schools.`);
  } else if (existsSync(aaDir)) {
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
    // Still write schools.json without coords
    writeFileSync(resolve(OUT, "schools.json"), JSON.stringify(schools, null, 2));
    writeFileSync(
      resolve(OUT, "tk_feeders.json"),
      JSON.stringify(tkFeeders, null, 2)
    );
  }
})();
