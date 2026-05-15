"use client";

import TierBadge from "./TierBadge";
import type { Tier } from "@/lib/types";

export type SchoolCardProps = {
  name: string;
  programName: string;
  tier: Tier;
  pctSuccess: number | null;
  /** Compact stat line like "25 seats/yr · 20 applicants in your tier · 4-yr avg" */
  statsLine?: string;
  /** Short phrase describing what % means */
  summary?: string;
  distanceMi?: number | null;
  reason?: string;
  added: boolean;
  onAdd: () => void;
  /** Optional small chips, e.g. ["Spanish Immersion", "K-8"] */
  chips?: string[];
};

export default function SchoolCard({
  name,
  programName,
  tier,
  pctSuccess,
  statsLine,
  summary,
  distanceMi,
  reason,
  added,
  onAdd,
  chips,
}: SchoolCardProps) {
  return (
    <div className="border border-rule rounded-2xl p-4 flex flex-col gap-3 bg-paper">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold leading-[1.3]">{name}</div>
          <div className="text-[12px] text-muted mt-0.5">{programName}</div>
          {chips && chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {chips.map((c) => (
                <span
                  key={c}
                  className="text-[11px] text-muted border border-rule rounded-full px-2 py-0.5"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {pctSuccess !== null && (
            <div className="text-[20px] font-semibold tabular-nums leading-none">
              {Math.round(pctSuccess * 100)}%
            </div>
          )}
          <TierBadge tier={tier} size="sm" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {statsLine && (
          <div className="text-[11px] text-muted tabular-nums">
            {statsLine}
            {distanceMi != null && (
              <span> · {distanceMi.toFixed(1)} mi from home</span>
            )}
          </div>
        )}
        {summary && pctSuccess !== null && (
          <div className="text-[12px] text-ink leading-[1.5]">
            <span className="font-medium tabular-nums">
              {Math.round(pctSuccess * 100)}%
            </span>{" "}
            of applicants like you {summary}
          </div>
        )}
        {!statsLine && reason && (
          <div className="text-[12px] text-muted leading-[1.55]">
            {reason}
            {distanceMi != null && (
              <span> · {distanceMi.toFixed(1)} mi from home</span>
            )}
          </div>
        )}
      </div>
      <button
        disabled={added}
        onClick={onAdd}
        className={`self-start h-9 px-4 rounded-full text-[13px] font-medium ${
          added
            ? "bg-rule/40 text-muted cursor-default"
            : "bg-ink text-paper hover:opacity-90"
        }`}
      >
        {added ? "Added" : "Add to ranking"}
      </button>
    </div>
  );
}
