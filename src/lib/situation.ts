"use client";

import type { Situation } from "./types";

const KEY = "schoolpath-sf:situation";

export function loadSituation(): Situation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Situation;
  } catch {
    return null;
  }
}

export function saveSituation(s: Situation) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

const LIST_KEY = "schoolpath-sf:list";
type StoredList = { schoolId: number; programCode: string }[];

export function loadList(): StoredList {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredList;
  } catch {
    return [];
  }
}

export function saveList(list: StoredList) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

/** Clears all locally stored data (situation + ranking). Used by the Start over flow. */
export function resetLocalData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(LIST_KEY);
}
