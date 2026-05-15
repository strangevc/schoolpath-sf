# SchoolPath SF

A balanced-ranking helper for SFUSD TK and Kindergarten families. Built around
the Strong shot / Likely / Stretch framing borrowed from college admissions,
using SFUSD's published 4-year success-rate data.

**Stack:** Next.js 16 (Turbopack, static export), Tailwind v4, TypeScript,
@dnd-kit (drag-to-rank), Turf (point-in-polygon), Mapbox (geocoder).

## Local setup

```bash
npm install
cp .env.local.example .env.local   # then paste your Mapbox token
npm run dev                         # http://localhost:3000
```

The Mapbox token is optional — without it, the auto-detection of attendance
area and CTIP1 falls back to manual selection. Everything else still works.

## Data

Raw data lives in `data/raw/`:

- `success_rates.csv` — SFUSD Main Round success rates (4-yr avg)
- `applicant_counts.csv` — applicant counts by rank (2-yr avg)
- `assignment_designations.csv` — seats by school × grade
- `ctip1_shapefile/` — CTIP1 polygon shapefile
- `aa_shapefile/` — **drop your AA shapefile here** (`.shp` + `.shx` + `.dbf`)

Rebuild the derived JSON whenever raw data changes:

```bash
npm run data:build
```

This emits `src/data/build/{schools,tk_feeders,ctip1,aa}.json`.

If the AA shapefile is missing the build still works; `aa.json` stays an empty
FeatureCollection and AA detection falls back to manual selection.

## Project structure

```
src/
  app/
    page.tsx               # marketing landing
    start/page.tsx         # Screen 1 — intake
    builder/page.tsx       # Screen 2 — ranking builder + coach
    review/page.tsx        # Screen 4 — final ranked list
    how-it-works/page.tsx  # explainer
  components/
    SortableRow.tsx        # drag-to-rank list item
    CompositionBar.tsx     # Strong/Likely/Stretch bar
    Coach.tsx              # contextual nudges
    AddSchoolsDrawer.tsx   # add-from-search drawer (v2 will add map)
    TierBadge.tsx
  lib/
    tier.ts                # tier calculation
    geocode.ts             # Mapbox geocode + AA / CTIP1 point-in-polygon
    situation.ts           # localStorage persistence
    data.ts                # JSON loaders
    types.ts
  data/build/              # generated JSON (committed for static export)
scripts/
  build-data.ts            # CSV + shapefile → JSON
```

## Build for production

```bash
npm run build
```

Output lands in `out/` — static HTML/JS/CSS, deployable to any static host.

## Deploy to Vercel

```bash
npm i -g vercel
vercel                       # first time
vercel --prod                # subsequent deploys
```

Set `NEXT_PUBLIC_MAPBOX_TOKEN` in the Vercel project settings.

## What's next (post-v1)

- Mapbox map in the Add Schools drawer with school pins colored by tier
  (needs school coordinates — geocode the SFUSD school directory at build
  time).
- Share-able URL for a ranking (encode list state in URL).
- Spanish/Cantonese/Chinese UI translations.
- "Optimal rank order" hint (deferred-acceptance is strategy-proof, but a
  short explainer helps).
- Aftercare availability per school.
