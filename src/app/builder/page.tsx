"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  loadList,
  loadSituation,
  saveList,
  saveSituation,
} from "@/lib/situation";
import { SCHOOLS, TK_FEEDERS, schoolById } from "@/lib/data";
import { bestProgramFor, oddsFor } from "@/lib/tier";
import type { ListItem, Situation } from "@/lib/types";
import SortableRow, { tierCount } from "@/components/SortableRow";
import CompositionBar from "@/components/CompositionBar";
import Coach, { computeNudges } from "@/components/Coach";
import Suggestions from "@/components/Suggestions";
import AddSchoolsDrawer from "@/components/AddSchoolsDrawer";

export default function BuilderPage() {
  const [situation, setSituation] = useState<Situation | null>(null);
  const [list, setList] = useState<ListItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const s = loadSituation();
    setSituation(s);
    const saved = loadList();
    if (saved.length && s) {
      const hydrated = saved
        .map((x) => {
          const sch = schoolById(x.schoolId);
          if (!sch) return null;
          const prog =
            (s.grade === "TK" ? sch.tkPrograms : sch.kPrograms).find(
              (p) => p.pathway === x.programCode
            ) ?? null;
          if (!prog) return null;
          const o = oddsFor(s, sch, prog);
          return {
            schoolId: x.schoolId,
            programCode: x.programCode,
            tier: o.tier,
          } as ListItem;
        })
        .filter((x): x is ListItem => x !== null);
      setList(hydrated);
    }
    setBootstrapped(true);
  }, []);

  // Auto-seed the list once on first arrival
  useEffect(() => {
    if (!bootstrapped || !situation) return;
    if (list.length > 0) return;
    const seeded: ListItem[] = [];
    const tryAdd = (schoolId: number) => {
      if (seeded.some((s) => s.schoolId === schoolId)) return;
      const sch = schoolById(schoolId);
      if (!sch) return;
      const best = bestProgramFor(situation, sch);
      if (!best) return;
      seeded.push({
        schoolId,
        programCode: best.program.pathway,
        tier: best.odds.tier,
      });
    };

    // 1. AA school
    if (situation.aaSchoolId) tryAdd(situation.aaSchoolId);

    // 2. Sibling school (if has TK/K seats)
    if (situation.siblingSchoolId) {
      const sib = schoolById(situation.siblingSchoolId);
      const list = situation.grade === "TK" ? sib?.tkPrograms : sib?.kPrograms;
      if (list && list.length > 0) tryAdd(situation.siblingSchoolId);
    }

    // 3. TK feeder destination
    if (situation.grade === "TK" && situation.prekSiteId) {
      const site = schoolById(situation.prekSiteId);
      site?.tkPrograms.forEach((p) => {
        if (p.feedsTo) tryAdd(p.feedsTo);
      });
    }

    if (seeded.length > 0) setList(seeded);
  }, [bootstrapped, situation, list.length]);

  // Persist list
  useEffect(() => {
    if (!bootstrapped) return;
    saveList(list.map((l) => ({ schoolId: l.schoolId, programCode: l.programCode })));
  }, [list, bootstrapped]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldI = list.findIndex(
      (l) => `${l.schoolId}-${l.programCode}` === active.id
    );
    const newI = list.findIndex(
      (l) => `${l.schoolId}-${l.programCode}` === over.id
    );
    if (oldI < 0 || newI < 0) return;
    setList(arrayMove(list, oldI, newI));
  };

  const counts = useMemo(() => tierCount(list), [list]);
  const totalSchools = list.length;
  const nudges = useMemo(
    () =>
      situation
        ? computeNudges(
            counts,
            totalSchools,
            list.some((l) => l.schoolId === situation.aaSchoolId),
            !!situation.siblingSchoolId,
            situation.grade
          )
        : [],
    [counts, totalSchools, list, situation]
  );

  const aaSchool = situation?.aaSchoolId
    ? schoolById(situation.aaSchoolId)
    : undefined;
  const sibSchool = situation?.siblingSchoolId
    ? schoolById(situation.siblingSchoolId)
    : undefined;
  const prekSite = situation?.prekSiteId
    ? schoolById(situation.prekSiteId)
    : undefined;

  if (!bootstrapped) return <div className="p-10 text-muted">Loading…</div>;

  if (!situation) {
    return (
      <main className="min-h-screen flex items-center justify-center p-10">
        <div className="text-center">
          <p className="text-muted">No situation found. Start here:</p>
          <Link
            href="/start"
            className="inline-block mt-4 h-12 px-6 rounded-full bg-ink text-paper font-medium"
          >
            Start
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-8 md:py-12">
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-[14px] font-medium tracking-wide text-muted hover:text-ink"
          >
            SchoolPath SF
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/start"
              className="text-[14px] text-muted hover:text-ink"
            >
              Update your information
            </Link>
            <Link
              href="/review"
              className="h-10 px-4 rounded-full bg-ink text-paper text-[14px] font-medium flex items-center hover:opacity-90"
            >
              Review your ranking
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          {/* LEFT: situation rail */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-rule p-4 flex flex-col gap-3">
              <div className="text-[12px] uppercase tracking-wide text-muted font-semibold">
                Your situation
              </div>
              <Row
                label="Grade"
                value={situation.grade === "TK" ? "Transitional K" : "Kindergarten"}
              />
              <Row
                label="Address"
                value={situation.address || "—"}
              />
              <Row
                label="Attendance area"
                value={aaSchool ? aaSchool.shortName : "Not detected"}
              />
              <Row
                label="CTIP1 zone"
                value={
                  situation.isCTIP1 === true
                    ? "Yes"
                    : situation.isCTIP1 === false
                      ? "No"
                      : "Unknown"
                }
              />
              <Row
                label="Sibling at"
                value={sibSchool ? sibSchool.shortName : "—"}
              />
              <Row
                label="Currently in"
                value={prekSite ? prekSite.shortName : "—"}
              />
            </div>

            {situation.grade === "TK" && prekSite && (
              <div className="rounded-2xl border border-strong/30 bg-strong-soft p-4">
                <div className="text-[12px] uppercase tracking-wide text-strong font-semibold">
                  TK feeder pattern
                </div>
                <div className="text-[13px] mt-2 leading-[1.55]">
                  Your current SFUSD site connects to one or more elementary
                  schools through SFUSD&rsquo;s TK feeder pattern. Students
                  who attend TK at the connected site automatically continue
                  to Kindergarten at the assigned elementary.
                </div>
              </div>
            )}
          </aside>

          {/* CENTER: the list */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-rule p-5 flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[22px] font-semibold tracking-tight">
                  Your ranking
                </h2>
                <div className="text-[13px] text-muted">
                  <span className="font-semibold text-ink">
                    {totalSchools}
                  </span>{" "}
                  of 18 schools. SFUSD recommends 15 to 18.
                </div>
              </div>
              <CompositionBar counts={counts} />
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={list.map((l) => `${l.schoolId}-${l.programCode}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3">
                  {list.map((item, i) => {
                    const sch = schoolById(item.schoolId)!;
                    const programs =
                      situation.grade === "TK" ? sch.tkPrograms : sch.kPrograms;
                    const prog =
                      programs.find((p) => p.pathway === item.programCode) ??
                      programs[0];
                    const o = oddsFor(situation, sch, prog);
                    return (
                      <SortableRow
                        key={`${item.schoolId}-${item.programCode}`}
                        id={`${item.schoolId}-${item.programCode}`}
                        rank={i + 1}
                        school={sch}
                        program={prog}
                        odds={o}
                        onRemove={() =>
                          setList((l) =>
                            l.filter(
                              (x) =>
                                !(
                                  x.schoolId === item.schoolId &&
                                  x.programCode === item.programCode
                                )
                            )
                          )
                        }
                      />
                    );
                  })}
                  {!list.length && (
                    <div className="rounded-2xl border border-dashed border-rule p-8 text-center text-muted">
                      Your ranking is empty. Use Add Schools to begin.
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>

            <Suggestions
              situation={situation}
              list={list}
              counts={counts}
              onAdd={(item) =>
                setList((l) => {
                  if (
                    l.some(
                      (x) =>
                        x.schoolId === item.schoolId &&
                        x.programCode === item.programCode
                    )
                  )
                    return l;
                  return [...l, item];
                })
              }
            />

            <button
              onClick={() => setDrawerOpen(true)}
              className="self-start h-12 px-5 rounded-full border border-ink text-ink text-[15px] font-medium hover:bg-ink hover:text-paper transition-colors"
            >
              Browse all schools with filters
            </button>
          </div>

          {/* RIGHT: coach */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
            <Coach nudges={nudges} />
          </aside>
        </div>
      </div>

      <AddSchoolsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        list={list}
        situation={situation}
        onAdd={(item) =>
          setList((l) => {
            if (
              l.some(
                (x) =>
                  x.schoolId === item.schoolId &&
                  x.programCode === item.programCode
              )
            )
              return l;
            return [...l, item];
          })
        }
      />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink text-right">{value}</span>
    </div>
  );
}
