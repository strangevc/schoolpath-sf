"use client";

import { useMemo, useState } from "react";
import { SCHOOLS } from "@/lib/data";
import { bestProgramFor } from "@/lib/tier";
import TierBadge from "./TierBadge";
import type { ListItem, Situation } from "@/lib/types";

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
  const [tierFilter, setTierFilter] = useState<
    "all" | "strong" | "likely" | "stretch"
  >("all");

  const onList = useMemo(
    () => new Set(list.map((l) => l.schoolId)),
    [list]
  );

  const items = useMemo(() => {
    const grade = situation.grade;
    return SCHOOLS.filter((s) => {
      const hasGrade =
        grade === "TK" ? s.tkPrograms.length > 0 : s.kPrograms.length > 0;
      if (!hasGrade) return false;
      if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    })
      .map((s) => {
        const best = bestProgramFor(situation, s);
        return { school: s, best };
      })
      .filter((x) => x.best !== null)
      .filter((x) =>
        tierFilter === "all" ? true : x.best!.odds.tier === tierFilter
      )
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
  }, [q, tierFilter, situation]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        className="absolute inset-0 bg-ink/30"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-[560px] h-full bg-paper shadow-xl flex flex-col">
        <div className="p-5 border-b border-rule flex items-center justify-between">
          <div>
            <div className="text-[18px] font-semibold">Add schools</div>
            <div className="text-[13px] text-muted">
              Sorted by likelihood of placement for your situation.
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
            placeholder="Search schools…"
            className="h-12 px-4 rounded-2xl border border-rule focus:outline-none focus:border-ink"
          />
          <div className="flex gap-2 flex-wrap">
            {(["all", "strong", "likely", "stretch"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`h-9 px-3 rounded-full border text-[13px] ${
                  tierFilter === t
                    ? "bg-ink text-paper border-ink"
                    : "border-rule hover:bg-rule/40"
                }`}
              >
                {t === "all"
                  ? "All categories"
                  : t === "strong"
                    ? "Likely"
                    : t === "likely"
                      ? "Possible"
                      : "Competitive"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {items.map(({ school, best }) => {
            const added = onList.has(school.idSchool);
            return (
              <div
                key={school.idSchool}
                className="border border-rule rounded-2xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold">
                      {school.name}
                    </div>
                    <div className="text-[12px] text-muted mt-0.5">
                      {best!.program.programName}
                    </div>
                  </div>
                  <TierBadge tier={best!.odds.tier} size="sm" />
                </div>
                <div className="text-[13px] text-muted leading-[1.5]">
                  {best!.odds.oddsPhrase}
                </div>
                <button
                  disabled={added}
                  onClick={() =>
                    onAdd({
                      schoolId: school.idSchool,
                      programCode: best!.program.pathway,
                      tier: best!.odds.tier,
                    })
                  }
                  className={`self-start mt-1 h-9 px-4 rounded-full text-[13px] font-medium ${
                    added
                      ? "bg-rule/40 text-muted"
                      : "bg-ink text-paper hover:opacity-90"
                  }`}
                >
                  {added ? "Added" : "Add to ranking"}
                </button>
              </div>
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
