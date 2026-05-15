import type { Tier } from "@/lib/types";

type Nudge = {
  kind: "warn" | "tip" | "ok";
  title: string;
  body: string;
};

export function computeNudges(
  counts: Record<Tier, number>,
  total: number,
  hasAA: boolean,
  hasSibling: boolean,
  grade: "TK" | "K"
): Nudge[] {
  const out: Nudge[] = [];

  if (total === 0) {
    out.push({
      kind: "tip",
      title: "Start with safety",
      body: "We've added the schools where you have the strongest claim. Add more from the map or search to round out a list of 15–18.",
    });
    return out;
  }

  if (total < 15)
    out.push({
      kind: "warn",
      title: `Your list has ${total} schools.`,
      body: "SFUSD recommends 15–18. Shorter lists mean more risk of being assigned outside your list entirely.",
    });
  if (total > 18)
    out.push({
      kind: "tip",
      title: `${total} schools is a lot.`,
      body: "Trim to your true preferences. The algorithm rewards honest ranking — extras only matter if your top picks miss.",
    });

  if (counts.strong === 0)
    out.push({
      kind: "warn",
      title: "No Strong shots in your list.",
      body: "If none of your Likely or Stretch picks come through, you'll be placed somewhere off your list. Add 2–3 schools where you have an advantage — usually your attendance area and any sibling-linked schools.",
    });

  if (counts.stretch > 0 && counts.stretch >= counts.likely + counts.strong)
    out.push({
      kind: "warn",
      title: "Your list is mostly Stretches.",
      body: "Stretch schools are popular and most families miss. Balance with more Strong shots and Likelies.",
    });

  if (total >= 15 && counts.strong >= 3 && counts.likely >= 5)
    out.push({
      kind: "ok",
      title: "Your list looks balanced.",
      body: "Now rank by honest preference — don't strategize the order. The algorithm rewards honest ranking.",
    });

  if (!hasAA && grade !== "TK")
    out.push({
      kind: "tip",
      title: "You haven't included your attendance area school.",
      body: "Most families do — it's usually the single best chance at a guaranteed seat.",
    });

  if (hasSibling)
    out.push({
      kind: "tip",
      title: "Sibling priority is powerful.",
      body: "Make sure your sibling's school is somewhere on your list. The sibling tiebreaker is strong but not absolute.",
    });

  if (grade === "TK")
    out.push({
      kind: "tip",
      title: "TK feeder = K guarantee.",
      body: "If you accept TK at your AA Early Ed or elementary site, your child auto-promotes to K at the connected elementary. You don't reapply.",
    });

  return out;
}

export default function Coach({ nudges }: { nudges: Nudge[] }) {
  if (!nudges.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[14px] font-semibold uppercase tracking-wide text-muted">
        Coach
      </h3>
      {nudges.map((n, i) => (
        <div
          key={i}
          className={`rounded-2xl p-4 border ${
            n.kind === "warn"
              ? "border-stretch/30 bg-stretch-soft"
              : n.kind === "ok"
                ? "border-strong/30 bg-strong-soft"
                : "border-rule bg-paper"
          }`}
        >
          <div className="flex gap-2 items-start">
            <span aria-hidden className="text-[16px] leading-none mt-0.5">
              {n.kind === "warn" ? "⚠️" : n.kind === "ok" ? "✓" : "💡"}
            </span>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-ink">
                {n.title}
              </div>
              <div className="text-[13px] text-muted leading-[1.55] mt-1">
                {n.body}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
