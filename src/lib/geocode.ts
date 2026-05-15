"use client";

import * as turf from "@turf/turf";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import ctip1 from "../data/build/ctip1.json";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export type GeocodeResult = {
  address: string;
  lat: number;
  lng: number;
};

export async function geocode(query: string): Promise<GeocodeResult | null> {
  if (!MAPBOX_TOKEN) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?access_token=${MAPBOX_TOKEN}&proximity=-122.4194,37.7749&bbox=-122.55,37.7,-122.35,37.83&limit=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data.features?.[0];
    if (!f) return null;
    return {
      address: f.place_name,
      lng: f.center[0],
      lat: f.center[1],
    };
  } catch {
    return null;
  }
}

export function isInCTIP1(lat: number, lng: number): boolean {
  const point = turf.point([lng, lat]);
  const fc = ctip1 as unknown as GeoJSON.FeatureCollection;
  for (const f of fc.features) {
    try {
      if (
        turf.booleanPointInPolygon(
          point,
          f as Feature<Polygon | MultiPolygon>
        )
      )
        return true;
    } catch {
      // skip non-polygon features
    }
  }
  return false;
}

// AA polygon detection — file is a stub by default; populated when the user
// drops their AA shapefile into data/raw/aa_shapefile/ and reruns data:build
import aaGeo from "../data/build/aa.json";
const _aa = aaGeo as unknown as GeoJSON.FeatureCollection;
async function loadAA(): Promise<GeoJSON.FeatureCollection | null> {
  return _aa && _aa.features && _aa.features.length > 0 ? _aa : null;
}

export type AALookup = { schoolId: number | null; schoolName: string | null };

export async function findAttendanceArea(
  lat: number,
  lng: number
): Promise<AALookup> {
  const aa = await loadAA();
  if (!aa) return { schoolId: null, schoolName: null };
  const point = turf.point([lng, lat]);
  for (const f of aa.features) {
    try {
      if (
        turf.booleanPointInPolygon(
          point,
          f as Feature<Polygon | MultiPolygon>
        )
      ) {
        const props = f.properties as Record<string, unknown> | null;
        if (!props) continue;
        // DataSF schema: synergy_na is the full SFUSD name, e_aa_schno is the
        // idSchool (as a float-string like "507.0").
        const rawId = props.e_aa_schno as string | number | undefined;
        const idNum =
          typeof rawId === "string"
            ? parseInt(rawId, 10)
            : typeof rawId === "number"
              ? Math.round(rawId)
              : null;
        const name =
          (props.synergy_na as string) ||
          (props.sch_lng_na as string) ||
          (props.aaname as string) ||
          null;
        return { schoolId: idNum && Number.isFinite(idNum) ? idNum : null, schoolName: name };
      }
    } catch {
      /* skip */
    }
  }
  return { schoolId: null, schoolName: null };
}
