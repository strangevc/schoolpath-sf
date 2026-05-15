import schools from "../data/build/schools.json";
import tkFeeders from "../data/build/tk_feeders.json";
import type { School } from "./types";

export const SCHOOLS = schools as unknown as School[];
export const TK_FEEDERS = tkFeeders as Record<string, number>;

export function schoolById(id: number): School | undefined {
  return SCHOOLS.find((s) => s.idSchool === id);
}

export function schoolsWithGrade(grade: "TK" | "K"): School[] {
  return SCHOOLS.filter((s) =>
    grade === "TK" ? s.tkPrograms.length > 0 : s.kPrograms.length > 0
  );
}
