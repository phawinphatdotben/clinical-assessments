export const CASE_PRESENTATION_FORM_TYPE = "Case Presentation" as const;

export const CASE_PRESENTATION_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

const CASE_PRESENTATION_TIERS: Record<string, readonly [number, number, number, number]> = {
  "Case Presentation - Content and currency": [7.5, 15, 22.5, 30],
  "Case Presentation - Evidence appraisal": [5, 10, 15, 20],
  "Case Presentation - Clinical application": [5, 10, 15, 20],
  "Case Presentation - Teaching media": [5, 10, 15, 20],
  "Case Presentation - Presentation skills": [2.5, 5, 7.5, 10],
};

export function getCasePresentationScoreTiers(criteriaKey: string): readonly [number, number, number, number] {
  return CASE_PRESENTATION_TIERS[criteriaKey] ?? [0, 0, 0, 0];
}

export function getCasePresentationScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("Case Presentation - ")) {
    return `Case Presentation-${criteriaKey.slice("Case Presentation - ".length)} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}
