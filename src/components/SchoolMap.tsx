"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import TierBadge from "./TierBadge";
import { MAPBOX_TOKEN } from "@/lib/geocode";
import ctip1Geo from "@/data/build/ctip1.json";
import type { ListItem, School, SchoolProgram, Tier } from "@/lib/types";

mapboxgl.accessToken = MAPBOX_TOKEN;

const TIER_BG: Record<Tier, string> = {
  strong: "#16a34a",
  likely: "#ca8a04",
  stretch: "#dc2626",
  unknown: "#9ca3af",
};

export type MapSchool = {
  school: School;
  program: SchoolProgram;
  tier: Tier;
  pctSuccess: number | null;
  distanceMi: number | null;
  visible: boolean; // false when filters hide it (still shown faded on map)
};

export default function SchoolMap({
  schools,
  userHome,
  onList,
  onAdd,
}: {
  schools: MapSchool[];
  userHome: { lat: number; lng: number } | null;
  onList: Set<number>;
  onAdd: (schoolId: number, programCode: string, tier: Tier) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) return;

    const center: [number, number] = userHome
      ? [userHome.lng, userHome.lat]
      : [-122.4376, 37.7749]; // SF center

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center,
      zoom: userHome ? 13 : 12,
      attributionControl: false,
    });
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.on("load", () => {
      // CTIP1 zone overlay
      map.addSource("ctip1", { type: "geojson", data: ctip1Geo as unknown as GeoJSON.FeatureCollection });
      map.addLayer({
        id: "ctip1-fill",
        type: "fill",
        source: "ctip1",
        paint: { "fill-color": "#01204F", "fill-opacity": 0.06 },
      });
      map.addLayer({
        id: "ctip1-outline",
        type: "line",
        source: "ctip1",
        paint: { "line-color": "#01204F", "line-opacity": 0.18, "line-width": 1 },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [userHome]);

  // Render / update markers when schools change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = markersRef.current;

    // Remove markers for schools no longer in the list
    const incomingIds = new Set(schools.map((s) => s.school.idSchool));
    for (const [id, m] of existing) {
      if (!incomingIds.has(id)) {
        m.remove();
        existing.delete(id);
      }
    }

    // Add or update markers
    schools.forEach((s) => {
      if (!s.school.coords) return;
      const id = s.school.idSchool;
      let marker = existing.get(id);
      const el = renderMarker(s, onList.has(id), selectedId === id);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedId((cur) => (cur === id ? null : id));
      });
      if (marker) {
        // Re-create marker element to reflect new state
        marker.remove();
      }
      marker = new mapboxgl.Marker({ element: el }).setLngLat([
        s.school.coords.lng,
        s.school.coords.lat,
      ]);
      marker.addTo(map);
      existing.set(id, marker);
    });

    // User home marker (separate, persists)
    const homeKey = -1;
    if (userHome) {
      const prev = existing.get(homeKey);
      if (prev) prev.remove();
      const homeEl = document.createElement("div");
      homeEl.className =
        "rounded-full bg-ink ring-2 ring-paper shadow-md";
      homeEl.style.width = "16px";
      homeEl.style.height = "16px";
      const hm = new mapboxgl.Marker({ element: homeEl }).setLngLat([
        userHome.lng,
        userHome.lat,
      ]);
      hm.addTo(map);
      existing.set(homeKey, hm);
    }
  }, [schools, onList, userHome, selectedId]);

  const selected = useMemo(
    () => schools.find((s) => s.school.idSchool === selectedId) ?? null,
    [schools, selectedId]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-2xl border border-rule p-8 text-center text-muted text-[14px]">
        Map view requires a Mapbox token. Add{" "}
        <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to your environment.
      </div>
    );
  }

  const hidden = schools.filter((s) => !s.school.coords);

  return (
    <div className="relative flex flex-col gap-3">
      <div
        ref={containerRef}
        className="w-full h-[460px] rounded-2xl overflow-hidden border border-rule"
      />

      {selected && (
        <div className="rounded-2xl border border-rule p-4 bg-paper flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold leading-[1.3]">
                {selected.school.sfusdUrl ? (
                  <a
                    href={selected.school.sfusdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline decoration-1 underline-offset-2"
                  >
                    {selected.school.name}
                    <span aria-hidden className="text-muted ml-1 text-[11px]">
                      ↗
                    </span>
                  </a>
                ) : (
                  selected.school.name
                )}
              </div>
              <div className="text-[12px] text-muted mt-0.5">
                {selected.program.programName}
                {selected.school.neighborhood && (
                  <span> · {selected.school.neighborhood}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {selected.pctSuccess !== null && (
                <div className="text-[18px] font-semibold tabular-nums leading-none">
                  {Math.round(selected.pctSuccess * 100)}%
                </div>
              )}
              <TierBadge tier={selected.tier} size="sm" />
            </div>
          </div>
          {selected.distanceMi != null && (
            <div className="text-[11px] text-muted tabular-nums">
              {selected.distanceMi.toFixed(1)} mi from home
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAdd(
                  selected.school.idSchool,
                  selected.program.pathway,
                  selected.tier
                );
                setSelectedId(null);
              }}
              disabled={onList.has(selected.school.idSchool)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium ${
                onList.has(selected.school.idSchool)
                  ? "bg-rule/40 text-muted cursor-default"
                  : "bg-ink text-paper hover:opacity-90"
              }`}
            >
              {onList.has(selected.school.idSchool) ? "Added" : "Add to ranking"}
            </button>
            <button
              onClick={() => setSelectedId(null)}
              className="h-9 px-3 rounded-full text-[13px] text-muted hover:bg-rule/40"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {hidden.length > 0 && (
        <div className="text-[11px] text-muted leading-[1.55] p-3 rounded-xl bg-rule/30">
          Not shown on map (no published coordinates):{" "}
          {hidden.map((s) => s.school.name).join(", ")}.
        </div>
      )}
    </div>
  );
}

function renderMarker(
  s: MapSchool,
  added: boolean,
  selected: boolean
): HTMLDivElement {
  const el = document.createElement("div");
  const dim = selected ? 26 : 20;
  const bg = s.visible ? TIER_BG[s.tier] : "#cbd5e1";
  const opacity = s.visible ? 1 : 0.55;
  el.style.cssText = `
    width: ${dim}px;
    height: ${dim}px;
    border-radius: 999px;
    background: ${bg};
    border: ${selected ? "3px" : "2px"} solid #fafaf7;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    cursor: pointer;
    opacity: ${opacity};
    ${added ? "outline: 2px solid #11161f; outline-offset: 1px;" : ""}
  `;
  el.title = `${s.school.name}${s.pctSuccess !== null ? ` — ${Math.round(s.pctSuccess * 100)}%` : ""}`;
  return el;
}
