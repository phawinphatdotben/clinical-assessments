export const OPD_CLINICAL_FORM_TYPE = "OPD Clinical Assessment" as const;

export const OPD_CLINICAL_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

const OPD_CLINICAL_TIERS: Record<string, readonly [number, number, number, number]> = {
  "OPD Clinical - Foundation knowledge": [4, 8, 12, 15],
  "OPD Clinical - Clinical evaluation": [4, 8, 12, 15],
  "OPD Clinical - Clinical reasoning and planning": [10, 15, 20, 30],
  "OPD Clinical - Management and follow-up": [10, 15, 20, 30],
  "OPD Clinical - Communication skills": [1, 2, 4, 5],
  "OPD Clinical - Professionalism checklist": [1, 2, 4, 5],
};

export function getOpdClinicalScoreTiers(criteriaKey: string): readonly [number, number, number, number] {
  return OPD_CLINICAL_TIERS[criteriaKey] ?? [1, 2, 3, 4];
}

export function getOpdClinicalScoreColumnName(criteriaKey: string): string {
  if (!criteriaKey.startsWith("OPD Clinical - ")) {
    return `${criteriaKey} SCORE`;
  }
  return `OPD Clinical-${criteriaKey.slice("OPD Clinical - ".length)} SCORE`;
}
