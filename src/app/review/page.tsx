"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadList, loadSituation } from "@/lib/situation";
import { schoolById } from "@/lib/data";
import { oddsFor } from "@/lib/tier";
import TierBadge from "@/components/TierBadge";
import type { ListItem, Situation } from "@/lib/types";

export default function ReviewPage() {
  const [situation, setSituation] = useState<Situation | null>(null);
  const [list, setList] = useState<ListItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = loadSituation();
    setSituation(s);
    const saved = loadList();
    if (s)
      setList(
        saved
          .map((x) => {
            const sch = schoolById(x.schoolId);
            const programs =
              s.grade === "TK" ? sch?.tkPrograms : sch?.kPrograms;
            const prog = programs?.find((p) => p.pathway === x.programCode);
            if (!sch || !prog) return null;
            return {
              schoolId: x.schoolId,
              programCode: x.programCode,
              tier: oddsFor(s, sch, prog).tier,
            } as ListItem;
          })
          .filter((x): x is ListItem => x !== null)
      );
  }, []);

  if (!situation) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Link
          href="/start"
          className="h-12 px-6 rounded-full bg-ink text-paper font-medium"
        >
          Start
        </Link>
      </main>
    );
  }

  const plain = list
    .map((l, i) => {
      const sch = schoolById(l.schoolId)!;
      const programs =
        situation.grade === "TK" ? sch.tkPrograms : sch.kPrograms;
      const prog = programs.find((p) => p.pathway === l.programCode) ?? programs[0];
      return `${i + 1}. ${sch.name} — ${prog.programName} (${prog.pathway})`;
    })
    .join("\n");

  return (
    <main className="min-h-screen">
      <div className="max-w-[820px] mx-auto px-6 md:px-10 py-10 md:py-16">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/builder"
            className="text-[14px] text-muted hover:text-ink"
          >
            ← Back to ranking
          </Link>
          <Link href="/" className="text-[14px] text-muted hover:text-ink">
            SchoolPath SF
          </Link>
        </header>

        <h1 className="text-[34px] md:text-[44px] leading-[1.1] font-semibold tracking-tight">
          Your ranking
        </h1>
        <p className="mt-3 text-muted text-[16px] leading-[1.6]">
          Submit your application at{" "}
          <a
            href="https://www.sfusd.edu/onlineapp"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            sfusd.edu/onlineapp
          </a>{" "}
          by January 30, 2026. Enter the schools below in this order.
        </p>

        <div className="mt-8 rounded-2xl border border-rule p-5">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-[18px] font-semibold">
              {list.length} schools, ranked
            </h2>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(plain);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="h-9 px-3 rounded-full border border-rule text-[13px] hover:bg-rule/40"
            >
              {copied ? "Copied" : "Copy as text"}
            </button>
          </div>
          <ol className="flex flex-col gap-2">
            {list.map((l, i) => {
              const sch = schoolById(l.schoolId)!;
              const programs =
                situation.grade === "TK" ? sch.tkPrograms : sch.kPrograms;
              const prog =
                programs.find((p) => p.pathway === l.programCode) ??
                programs[0];
              return (
                <li
                  key={`${l.schoolId}-${l.programCode}`}
                  className="flex items-start gap-3 py-2 border-b border-rule last:border-b-0"
                >
                  <span className="w-7 text-right text-muted tabular-nums">
                    {i + 1}.
                  </span>
                  <div className="flex-1">
                    <div className="text-[15px] font-medium">{sch.name}</div>
                    <div className="text-[12px] text-muted">
                      {prog.programName} ({prog.pathway})
                    </div>
                  </div>
                  <TierBadge tier={l.tier} size="sm" />
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 rounded-2xl bg-rule/30 p-5 flex flex-col gap-3 text-[14px] leading-[1.6]">
          <h3 className="text-[16px] font-semibold">What to expect next</h3>
          <ul className="flex flex-col gap-2 text-muted">
            <li>
              <strong className="text-ink">January 30, 2026:</strong>{" "}
              Main Round applications close. Applications submitted after this
              date are processed in later rounds with reduced availability.
            </li>
            <li>
              <strong className="text-ink">March 16, 2026:</strong>{" "}
              SFUSD posts placement results to ParentVUE and mails letters.
            </li>
            <li>
              <strong className="text-ink">Honest ranking is the
              recommended strategy.</strong>{" "}
              SFUSD uses a deferred acceptance algorithm. Ranking schools in
              your true order of preference is the most effective approach.
            </li>
            <li>
              <strong className="text-ink">Aftercare:</strong>{" "}
              Wraparound care is enrolled separately. Confirm availability
              with each school you would accept.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
