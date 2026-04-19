import type { WpbaFormConfig } from "../../components/forms/wpba-config";

/** Stored on each Assessment row; sum of numeric criterion points for that form. */
export const CRITERIA_SCORE_SUM_COLUMN = "Criteria Score Sum";

function dopsValueToPoints(raw: string): number | null {
  const x = raw.trim().toLowerCase();
  if (x === "understandard" || x === "understand") {
    return 1;
  }
  if (x === "standard") {
    return 2;
  }
  if (x === "exceptional") {
    return 3;
  }
  if (x.includes("cannot")) {
    return null;
  }
  return null;
}

function numericTierToPoints(raw: string): number | null {
  const n = Number(raw.trim());
  if (!Number.isNaN(n) && n >= 1 && n <= 4) {
    return n;
  }
  return null;
}

function pointsFromCriterionCell(formType: string, raw: string | undefined): number | null {
  if (raw == null || raw === "") {
    return null;
  }
  if (formType === "DOPS") {
    return dopsValueToPoints(raw);
  }
  return numericTierToPoints(raw);
}

/**
 * Sum criterion scores at submit time from WpbaForm `formData` + config.
 * DOPS: maps labels to 1–3; other WPBA forms: expects 1–4 tier values as stored in the form.
 */
export function computeCriteriaScoreSumFromFormData(
  formData: Record<string, string>,
  config: WpbaFormConfig
): number | null {
  const { formType, criteriaKeys } = config;
  if (!criteriaKeys.length) {
    return null;
  }

  let total = 0;
  let counted = 0;
  for (const criteriaKey of criteriaKeys) {
    const p = pointsFromCriterionCell(formType, formData[criteriaKey]);
    if (p != null) {
      total += p;
      counted += 1;
    }
  }

  return counted > 0 ? total : null;
}

/**
 * Recompute sum from a persisted Assessment row (for display if column missing, or verification).
 * Uses `* SCORE` columns for CbD/MiniCEX/etc., and `DOPS - …` keys for DOPS.
 */
export function computeCriteriaScoreSumFromAssessmentRow(row: Record<string, unknown>): number | null {
  let total = 0;
  let counted = 0;

  for (const [key, val] of Object.entries(row)) {
    if (key.endsWith(" SCORE")) {
      const p = numericTierToPoints(String(val ?? ""));
      if (p != null) {
        total += p;
        counted += 1;
      }
    }
  }

  for (const [key, val] of Object.entries(row)) {
    if (key.startsWith("DOPS - ") && !key.toLowerCase().includes("overall")) {
      const p = dopsValueToPoints(String(val ?? ""));
      if (p != null) {
        total += p;
        counted += 1;
      }
    }
  }

  return counted > 0 ? total : null;
}

export function pickStoredOrComputedScoreSum(row: Record<string, unknown>): string {
  const raw = row[CRITERIA_SCORE_SUM_COLUMN];
  if (raw != null && raw !== "") {
    if (typeof raw === "number" && !Number.isNaN(raw)) {
      return String(raw);
    }
    const s = String(raw).trim();
    if (s) {
      return s;
    }
  }
  const computed = computeCriteriaScoreSumFromAssessmentRow(row);
  return computed != null ? String(computed) : "";
}
