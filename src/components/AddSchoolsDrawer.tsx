"use client";

import { useMemo, useState } from "react";
import { SCHOOLS } from "@/lib/data";
import { bestProgramFor } from "@/lib/tier";
import { milesBetween } from "@/lib/suggest";
import SchoolCard from "./SchoolCard";
import type { ListItem, Situation, Tier } from "@/lib/types";

const LANGUAGE_OPTIONS = [
  "Cantonese Immersion",
  "Cantonese Biliteracy",
  "Mandarin Immersion",
  "Spanish Immersion",
  "Spanish Biliteracy",
  "Japanese Bilingual",
  "Korean Immersion",
  "Filipino FLES",
];
const SCHOOL_TYPES = [
  { value: "ES", label: "K-5 elementary" },
  { value: "K8", label: "K-8" },
  { value: "EarlyEd", label: "Early Education site" },
] as const;
const DISTANCE_OPTIONS = [
  { value: 1, label: "Within 1 mi" },
  { value: 2, label: "Within 2 mi" },
  { value: 3, label: "Within 3 mi" },
] as const;

export default function AddSchoolsDrawer({
  open,
  onClose,
  list,
  onAdd,
  situation,
}: {
  open: boolean;
  onClose: () => void;
  list: ListItem[];
  onAdd: (item: ListItem) => void;
  situation: Situation;
}) {
  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState<Tier | "all">("all");
  const [langFilter, setLangFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [distFilter, setDistFilter] = useState<number | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);

  const onList = useMemo(() => new Set(list.map((l) => l.schoolId)), [list]);
  const home = situation.lat && situation.lng
    ? { lat: situation.lat, lng: situation.lng }
    : null;

  const allNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    SCHOOLS.forEach((s) => s.neighborhood && set.add(s.neighborhood));
    return [...set].sort();
  }, []);

  const items = useMemo(() => {
    const grade = situation.grade;
    return SCHOOLS.filter((s) => {
      const hasGrade =
        grade === "TK" ? s.tkPrograms.length > 0 : s.kPrograms.length > 0;
      if (!hasGrade) return false;
      if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (typeFilter.length && !typeFilter.includes(s.tags.schoolType))
        return false;
      if (langFilter.length) {
        const overlap = s.tags.languages.some((l) => langFilter.includes(l));
        if (!overlap) return false;
      }
      if (neighborhoods.length && !neighborhoods.includes(s.neighborhood || ""))
        return false;
      return true;
    })
      .map((s) => {
        const best = bestProgramFor(situation, s);
        const dist = home && s.coords ? milesBetween(home, s.coords) : null;
        return { school: s, best, dist };
      })
      .filter((x) => x.best !== null)
      .filter((x) => (tierFilter === "all" ? true : x.best!.odds.tier === tierFilter))
      .filter((x) => (distFilter == null ? true : x.dist != null && x.dist <= distFilter))
      .sort((a, b) => {
        const rank: Record<string, number> = {
          strong: 0,
          likely: 1,
          stretch: 2,
          unknown: 3,
        };
        const ra = rank[a.best!.odds.tier];
        const rb = rank[b.best!.odds.tier];
        if (ra !== rb) return ra - rb;
        return (b.best!.odds.pctSuccess ?? 0) - (a.best!.odds.pctSuccess ?? 0);
      });
  }, [q, tierFilter, langFilter, typeFilter, distFilter, neighborhoods, situation, home]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        className="absolute inset-0 bg-ink/30"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-[640px] h-full bg-paper shadow-xl flex flex-col">
        <div className="p-5 border-b border-rule flex items-center justify-between">
          <div>
            <div className="text-[18px] font-semibold">Add schools</div>
            <div className="text-[13px] text-muted">
              {items.length} {items.length === 1 ? "match" : "matches"}, sorted
              by likelihood for your situation.
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-rule hover:bg-rule/40"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3 border-b border-rule">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by school name"
            className="h-12 px-4 rounded-2xl border border-rule focus:outline-none focus:border-ink"
          />

          <FilterGroup label="Category">
            <Chips
              options={[
                { value: "all", label: "All" },
                { value: "strong", label: "Likely" },
                { value: "likely", label: "Possible" },
                { value: "stretch", label: "Competitive" },
              ]}
              value={tierFilter}
              onChange={(v) => setTierFilter(v as Tier | "all")}
            />
          </FilterGroup>

          {home && (
            <FilterGroup label="Distance from home">
              <Chips
                options={[
                  { value: "any", label: "Any" },
                  ...DISTANCE_OPTIONS.map((d) => ({
                    value: String(d.value),
                    label: d.label,
                  })),
                ]}
                value={distFilter == null ? "any" : String(distFilter)}
                onChange={(v) => setDistFilter(v === "any" ? null : Number(v))}
              />
            </FilterGroup>
          )}

          <FilterGroup label="School type">
            <MultiChips
              options={SCHOOL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </FilterGroup>

          <FilterGroup label="Language program">
            <MultiChips
              options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l }))}
              value={langFilter}
              onChange={setLangFilter}
            />
          </FilterGroup>

          {allNeighborhoods.length > 0 && (
            <FilterGroup label="Neighborhood">
              <MultiChips
                options={allNeighborhoods.map((n) => ({ value: n, label: n }))}
                value={neighborhoods}
                onChange={setNeighborhoods}
              />
            </FilterGroup>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {items.map(({ school, best, dist }) => {
            const added = onList.has(school.idSchool);
            const chips: string[] = [];
            if (school.tags.schoolType === "K8") chips.push("K-8");
            if (school.tags.schoolType === "EarlyEd") chips.push("Early Ed");
            school.tags.languages.forEach((l) => chips.push(l));
            if (school.neighborhood) chips.push(school.neighborhood);
            return (
              <SchoolCard
                key={school.idSchool}
                name={school.name}
                programName={best!.program.programName}
                tier={best!.odds.tier}
                pctSuccess={best!.odds.pctSuccess}
                distanceMi={dist}
                oddsPhrase={best!.odds.oddsPhrase}
                chips={chips}
                added={added}
                onAdd={() =>
                  onAdd({
                    schoolId: school.idSchool,
                    programCode: best!.program.pathway,
                    tier: best!.odds.tier,
                  })
                }
              />
            );
          })}
          {!items.length && (
            <div className="text-[14px] text-muted py-8 text-center">
              No schools match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">
        {label}
      </div>
      {children}
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 px-3 rounded-full border text-[13px] ${
            value === o.value
              ? "bg-ink text-paper border-ink"
              : "border-rule hover:bg-rule/40"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MultiChips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => {
        const active = value.includes(o.value);
        return (
          <button
            key={o.value}
            onClick={() => toggle(o.value)}
            className={`h-8 px-3 rounded-full border text-[13px] ${
              active
                ? "bg-ink text-paper border-ink"
                : "border-rule hover:bg-rule/40"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
