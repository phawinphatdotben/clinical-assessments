export const OPD_ASSESSMENT_FORM_TYPE = "OPD Assessment" as const;

export const OPD_ASSESSMENT_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

const OPD_ASSESSMENT_TIERS: Record<string, readonly [number, number, number, number]> = {
  "OPD Assessment - History": [5, 10, 15, 20],
  "OPD Assessment - Physical examination": [5, 10, 15, 20],
  "OPD Assessment - Problem list": [2.5, 5, 7.5, 10],
  "OPD Assessment - Provisional diagnosis": [2.5, 5, 7.5, 10],
  "OPD Assessment - Differential diagnosis and discussion": [5, 10, 15, 20],
  "OPD Assessment - Investigation and interpretation": [2.5, 5, 7.5, 10],
  "OPD Assessment - Management plan": [2.5, 5, 7.5, 10],
};

export function getOpdAssessmentScoreTiers(criteriaKey: string): readonly [number, number, number, number] {
  return OPD_ASSESSMENT_TIERS[criteriaKey] ?? [0, 0, 0, 0];
}

export function getOpdAssessmentScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("OPD Assessment - ")) {
    return `OPD Assessment-${criteriaKey.slice("OPD Assessment - ".length)} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}
