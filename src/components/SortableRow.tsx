"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TierBadge from "./TierBadge";
import type { ProgramOdds, School, SchoolProgram, Tier } from "@/lib/types";

export default function SortableRow({
  id,
  rank,
  school,
  program,
  odds,
  onRemove,
}: {
  id: string;
  rank: number;
  school: School;
  program: SchoolProgram;
  odds: ProgramOdds;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border border-rule rounded-2xl p-4 bg-paper flex gap-3 items-start"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab active:cursor-grabbing text-muted hover:text-ink select-none touch-none"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <div className="w-8 text-[20px] font-semibold text-muted tabular-nums shrink-0 text-center">
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold truncate">
              {school.name}
            </div>
            <div className="text-[12px] text-muted mt-0.5">
              {program.programName}
            </div>
          </div>
          <TierBadge tier={odds.tier} size="sm" />
        </div>
        <div className="text-[12px] text-muted mt-2 leading-[1.55]">
          {odds.oddsPhrase}
        </div>
        <div className="text-[11px] text-muted mt-1">
          Based on the tier for applicants where {odds.why}.
        </div>
      </div>

      <button
        onClick={onRemove}
        aria-label="Remove"
        className="text-muted hover:text-stretch w-8 h-8 flex items-center justify-center shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

export function tierCount(items: { tier: Tier }[]) {
  return items.reduce(
    (acc, i) => {
      acc[i.tier] += 1;
      return acc;
    },
    { strong: 0, likely: 0, stretch: 0, unknown: 0 } as Record<Tier, number>
  );
}
