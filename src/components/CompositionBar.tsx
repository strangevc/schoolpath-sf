import type { Tier } from "@/lib/types";

export default function CompositionBar({
  counts,
}: {
  counts: Record<Tier, number>;
}) {
  const total = counts.strong + counts.likely + counts.stretch + counts.unknown;
  if (total === 0)
    return (
      <div className="h-2 rounded-full bg-rule/40 overflow-hidden" aria-hidden />
    );
  const pct = (n: number) => (n / total) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="h-2 rounded-full bg-rule/40 overflow-hidden flex">
        {counts.strong > 0 && (
          <div style={{ width: `${pct(counts.strong)}%` }} className="bg-strong" />
        )}
        {counts.likely > 0 && (
          <div style={{ width: `${pct(counts.likely)}%` }} className="bg-likely" />
        )}
        {counts.stretch > 0 && (
          <div
            style={{ width: `${pct(counts.stretch)}%` }}
            className="bg-stretch"
          />
        )}
        {counts.unknown > 0 && (
          <div
            style={{ width: `${pct(counts.unknown)}%` }}
            className="bg-rule"
          />
        )}
      </div>
      <div className="flex gap-4 text-[12px] text-muted">
        <span>
          <Dot className="bg-strong" /> Strong {counts.strong}
        </span>
        <span>
          <Dot className="bg-likely" /> Likely {counts.likely}
        </span>
        <span>
          <Dot className="bg-stretch" /> Stretch {counts.stretch}
        </span>
        {counts.unknown > 0 && (
          <span>
            <Dot className="bg-rule" /> Unknown {counts.unknown}
          </span>
        )}
      </div>
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-1 align-middle ${className}`}
    />
  );
}
