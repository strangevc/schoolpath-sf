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
      title: "Getting started",
      body: "Schools where you have the strongest claim are added automatically. Use the Add Schools button to build out a full ranking of 15 to 18.",
    });
    return out;
  }

  if (total < 15)
    out.push({
      kind: "warn",
      title: `Your ranking currently lists ${total} ${total === 1 ? "school" : "schools"}.`,
      body: "SFUSD recommends ranking 15 to 18 schools. Shorter rankings increase the chance of being assigned to a school not on your list.",
    });
  if (total > 18)
    out.push({
      kind: "tip",
      title: `Your ranking lists ${total} schools.`,
      body: "Consider removing any schools you would not accept. The assignment algorithm uses your ordering, so ranking schools you would decline can affect your outcome.",
    });

  if (counts.strong === 0)
    out.push({
      kind: "warn",
      title: "No Likely placements in your ranking.",
      body: "If none of your Possible or Competitive choices result in placement, you may be assigned to a school not on your list. Consider including schools where your tiebreakers apply, such as your attendance area or any sibling-linked schools.",
    });

  if (counts.stretch > 0 && counts.stretch >= counts.likely + counts.strong)
    out.push({
      kind: "warn",
      title: "Most of your ranking is Competitive.",
      body: "Competitive schools have more applicants than seats. Adding Likely and Possible placements increases the chance of being assigned to a school you ranked.",
    });

  if (total >= 15 && counts.strong >= 3 && counts.likely >= 5)
    out.push({
      kind: "ok",
      title: "Your ranking is balanced.",
      body: "Order your choices by your true preference. SFUSD uses a deferred acceptance algorithm, which is most effective when applicants rank schools honestly.",
    });

  if (!hasAA && grade !== "TK")
    out.push({
      kind: "tip",
      title: "Attendance area school not included.",
      body: "Most families include their attendance area elementary in their ranking. It is typically the strongest tiebreaker available.",
    });

  if (hasSibling)
    out.push({
      kind: "tip",
      title: "Sibling priority applies to your ranking.",
      body: "Confirm your sibling's school is included if you want that school. Sibling priority is strong but not absolute when a school is oversubscribed.",
    });

  if (grade === "TK")
    out.push({
      kind: "tip",
      title: "TK feeder note",
      body: "For 2026-27, students who accept a TK placement automatically continue to Kindergarten at the connected elementary school. A separate Kindergarten application is not required.",
    });

  return out;
}

export default function Coach({ nudges }: { nudges: Nudge[] }) {
  if (!nudges.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted">
        Suggestions
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
          <div className="text-[14px] font-semibold text-ink">{n.title}</div>
          <div className="text-[13px] text-muted leading-[1.6] mt-1">
            {n.body}
          </div>
        </div>
      ))}
    </div>
  );
}
