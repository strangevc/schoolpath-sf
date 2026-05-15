import { TIER_COPY } from "@/lib/tier";
import type { Tier } from "@/lib/types";

const styles: Record<Tier, string> = {
  strong: "bg-strong-soft text-strong",
  likely: "bg-likely-soft text-likely",
  stretch: "bg-stretch-soft text-stretch",
  unknown: "bg-rule/40 text-muted",
};

export default function TierBadge({
  tier,
  size = "md",
}: {
  tier: Tier;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "text-[11px] h-5 px-2" : "text-[12px] h-6 px-2.5";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${styles[tier]} ${cls}`}
    >
      {TIER_COPY[tier].label}
    </span>
  );
}
