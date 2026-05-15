"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSituation } from "@/lib/situation";
import { SCHOOLS, schoolsWithGrade } from "@/lib/data";
import {
  findAttendanceArea,
  geocode,
  isInCTIP1,
  MAPBOX_TOKEN,
} from "@/lib/geocode";
import type { Grade, Situation } from "@/lib/types";

const MATTERS_OPTIONS = [
  "Walking distance",
  "Language immersion",
  "Strong aftercare",
  "Arts",
  "Sports / outdoors",
  "Small school",
  "Special education support",
  "Diverse community",
];

export default function StartPage() {
  const router = useRouter();
  const [grade, setGrade] = useState<Grade>("TK");
  const [address, setAddress] = useState("");
  const [aaSchoolId, setAaSchoolId] = useState<number | undefined>();
  const [ctip1, setCtip1] = useState<"yes" | "no" | "unknown">("unknown");
  const [hasSibling, setHasSibling] = useState(false);
  const [siblingSchoolId, setSiblingSchoolId] = useState<number | undefined>();
  const [inPrek, setInPrek] = useState(false);
  const [prekSiteId, setPrekSiteId] = useState<number | undefined>();
  const [matters, setMatters] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const tkSchools = schoolsWithGrade("TK");
  const kSchools = schoolsWithGrade("K");
  const allElem = [...new Set([...tkSchools, ...kSchools])];

  const toggleMatters = (opt: string) =>
    setMatters((m) =>
      m.includes(opt) ? m.filter((x) => x !== opt) : [...m, opt]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let lat: number | undefined;
    let lng: number | undefined;
    let resolvedAddress = address;
    let detectedAA = aaSchoolId;
    let detectedCTIP = ctip1 === "yes";
    if (address && MAPBOX_TOKEN) {
      const g = await geocode(address);
      if (g) {
        lat = g.lat;
        lng = g.lng;
        resolvedAddress = g.address;
        detectedCTIP = isInCTIP1(g.lat, g.lng);
        const aa = await findAttendanceArea(g.lat, g.lng);
        if (aa.schoolId) {
          // Confirm we have data for this school
          const match = SCHOOLS.find((s) => s.idSchool === aa.schoolId);
          if (match) detectedAA = match.idSchool;
        } else if (aa.schoolName) {
          const match = SCHOOLS.find(
            (s) =>
              s.name.toLowerCase() === aa.schoolName!.toLowerCase() ||
              s.name.toLowerCase().startsWith(aa.schoolName!.toLowerCase())
          );
          if (match) detectedAA = match.idSchool;
        }
      }
    }
    const s: Situation = {
      address: resolvedAddress || undefined,
      lat,
      lng,
      grade,
      aaSchoolId: detectedAA,
      isCTIP1: address && MAPBOX_TOKEN ? detectedCTIP : ctip1 === "yes",
      siblingSchoolId: hasSibling ? siblingSchoolId : undefined,
      prekSiteId: inPrek ? prekSiteId : undefined,
      matters,
    };
    saveSituation(s);
    router.push("/builder");
  };

  return (
    <main className="min-h-screen px-6 py-16 md:py-20">
      <div className="max-w-[640px] mx-auto">
        <a href="/" className="text-sm text-muted hover:text-ink">
          ← SchoolPath SF
        </a>
        <h1 className="mt-6 text-[34px] md:text-[44px] leading-[1.1] font-semibold tracking-tight">
          About your family
        </h1>
        <p className="mt-3 text-muted text-[16px] md:text-[17px] leading-[1.6]">
          Your information stays on your device. We do not collect or
          transmit any personal data.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-9">
          <Field
            label="What grade are you applying for?"
            help="Beginning in 2026-27, students who attend TK at an SFUSD site automatically continue to Kindergarten at the connected elementary school. No second application is required."
          >
            <div className="flex gap-2">
              {(["TK", "K"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`flex-1 h-14 rounded-2xl border text-[17px] font-medium transition-colors ${
                    grade === g
                      ? "border-ink bg-ink text-paper"
                      : "border-rule hover:bg-rule/40"
                  }`}
                >
                  {g === "TK"
                    ? "Transitional Kindergarten"
                    : "Kindergarten"}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label="Your home address"
            help="Used to determine your attendance area school and whether you qualify for the CTIP1 tiebreaker. Address is not saved to any server."
          >
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="500 Lincoln Way, San Francisco"
              className="w-full h-14 px-4 rounded-2xl border border-rule text-[16px] focus:outline-none focus:border-ink"
            />
          </Field>

          <Field
            label="Your attendance area school"
            help="Detected automatically from your address. You can also select it manually below, or skip if you are unsure."
          >
            <SchoolSelect
              schools={allElem}
              value={aaSchoolId}
              onChange={setAaSchoolId}
              placeholder="Pick your AA elementary (optional)"
            />
          </Field>

          <Field
            label="Do you live in a CTIP1 area?"
            help="CTIP1 (Census Tract Integration Preference) is an SFUSD tiebreaker for residents of designated areas. Detected automatically from your address."
          >
            <div className="flex gap-2">
              {(["yes", "no", "unknown"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCtip1(v)}
                  className={`flex-1 h-12 rounded-2xl border text-[15px] capitalize transition-colors ${
                    ctip1 === v
                      ? "border-ink bg-ink text-paper"
                      : "border-rule hover:bg-rule/40"
                  }`}
                >
                  {v === "unknown" ? "I'm not sure" : v}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Do you have a sibling currently in SFUSD?">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHasSibling(false)}
                className={`flex-1 h-12 rounded-2xl border text-[15px] transition-colors ${
                  !hasSibling
                    ? "border-ink bg-ink text-paper"
                    : "border-rule hover:bg-rule/40"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setHasSibling(true)}
                className={`flex-1 h-12 rounded-2xl border text-[15px] transition-colors ${
                  hasSibling
                    ? "border-ink bg-ink text-paper"
                    : "border-rule hover:bg-rule/40"
                }`}
              >
                Yes
              </button>
            </div>
            {hasSibling && (
              <div className="mt-3">
                <SchoolSelect
                  schools={SCHOOLS}
                  value={siblingSchoolId}
                  onChange={setSiblingSchoolId}
                  placeholder="Which school?"
                />
              </div>
            )}
          </Field>

          <Field
            label="Currently enrolled in SFUSD PreK or TK?"
            help="Students currently at an SFUSD Early Education site may have feeder priority for the connected elementary school."
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInPrek(false)}
                className={`flex-1 h-12 rounded-2xl border text-[15px] transition-colors ${
                  !inPrek
                    ? "border-ink bg-ink text-paper"
                    : "border-rule hover:bg-rule/40"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setInPrek(true)}
                className={`flex-1 h-12 rounded-2xl border text-[15px] transition-colors ${
                  inPrek
                    ? "border-ink bg-ink text-paper"
                    : "border-rule hover:bg-rule/40"
                }`}
              >
                Yes
              </button>
            </div>
            {inPrek && (
              <div className="mt-3">
                <SchoolSelect
                  schools={SCHOOLS}
                  value={prekSiteId}
                  onChange={setPrekSiteId}
                  placeholder="Which Early Ed or elementary site?"
                />
              </div>
            )}
          </Field>

          <Field
            label="Priorities (optional)"
            help="Used to surface schools that may match your priorities. Select any that apply."
          >
            <div className="flex flex-wrap gap-2">
              {MATTERS_OPTIONS.map((opt) => {
                const active = matters.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMatters(opt)}
                    className={`px-4 h-10 rounded-full border text-[14px] transition-colors ${
                      active
                        ? "border-ink bg-ink text-paper"
                        : "border-rule hover:bg-rule/40"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="self-start h-14 px-8 rounded-full bg-ink text-paper text-[16px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? "Looking up your address…" : "Continue"}
          </button>
          {!MAPBOX_TOKEN && (
            <div className="text-[12px] text-muted bg-rule/30 p-3 rounded-xl leading-[1.55]">
              Automatic detection of attendance area and CTIP1 is currently
              disabled. Manual selections will still produce a valid ranking.
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[15px] font-semibold text-ink">{label}</label>
      {help && <div className="text-[13px] text-muted leading-[1.5]">{help}</div>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SchoolSelect({
  schools,
  value,
  onChange,
  placeholder,
}: {
  schools: { idSchool: number; name: string }[];
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value ? Number(e.target.value) : undefined)
      }
      className="w-full h-12 px-3 rounded-2xl border border-rule text-[15px] focus:outline-none focus:border-ink bg-paper"
    >
      <option value="">{placeholder}</option>
      {schools.map((s) => (
        <option key={s.idSchool} value={s.idSchool}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
