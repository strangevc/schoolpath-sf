"use client";

import SchoolCard from "./SchoolCard";
import type { ListItem, Situation, Tier } from "@/lib/types";
import { suggestNextAdds, mostUnderweightedTier } from "@/lib/suggest";

export default function Suggestions({
  situation,
  list,
  counts,
  onAdd,
}: {
  situation: Situation;
  list: ListItem[];
  counts: Record<Tier, number>;
  onAdd: (item: ListItem) => void;
}) {
  const target = mostUnderweightedTier(counts);
  const suggestions = suggestNextAdds(situation, list, counts, 5);

  if (!suggestions.length) return null;

  const headerText =
    target === "strong"
      ? "Suggested Likely schools to consider next"
      : target === "likely"
        ? "Suggested Possible schools to consider next"
        : target === "stretch"
          ? "Suggested Competitive schools to consider next"
          : "Suggested next additions";

  return (
    <div className="rounded-2xl border border-rule p-5 bg-paper">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-[16px] font-semibold">{headerText}</h3>
        <div className="text-[12px] text-muted">
          Refreshes as you add schools
        </div>
      </div>
      <p className="text-[13px] text-muted leading-[1.55] mb-4">
        These schools fill the most underweighted category in your current
        ranking, based on a balanced target of 5 Likely, 8 Possible, and 5
        Competitive.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s) => {
          const chips: string[] = [];
          if (s.school.tags.schoolType === "K8") chips.push("K-8");
          if (s.school.tags.schoolType === "EarlyEd") chips.push("Early Ed");
          if (s.school.neighborhood) chips.push(s.school.neighborhood);
          return (
            <SchoolCard
              key={s.school.idSchool}
              name={s.school.name}
              programName={s.programName}
              tier={s.tier}
              pctSuccess={s.pctSuccess}
              distanceMi={s.distanceMi}
              reason={s.reason}
              chips={chips}
              added={false}
              onAdd={() =>
                onAdd({
                  schoolId: s.school.idSchool,
                  programCode: s.programCode,
                  tier: s.tier,
                })
              }
            />
          );
        })}
      </div>
    </div>
  );
}
