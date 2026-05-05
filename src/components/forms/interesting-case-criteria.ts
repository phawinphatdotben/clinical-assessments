export const INTERESTING_CASE_FORM_TYPE = "Interesting Case Presentation" as const;

export const INTERESTING_CASE_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

const INTERESTING_CASE_TIERS: Record<string, readonly [number, number, number, number]> = {
  "Interesting Case - Patient summary": [3.75, 7.5, 11.25, 15],
  "Interesting Case - Clinical diagnosis process": [7.5, 15, 22.5, 30],
  "Interesting Case - Management and holistic care": [6.25, 12.5, 18.75, 25],
  "Interesting Case - Discussion": [3.75, 7.5, 11.25, 15],
  "Interesting Case - Presentation media and delivery": [3.75, 7.5, 11.25, 15],
};

export function getInterestingCaseScoreTiers(criteriaKey: string): readonly [number, number, number, number] {
  return INTERESTING_CASE_TIERS[criteriaKey] ?? [0, 0, 0, 0];
}

export function getInterestingCaseScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("Interesting Case - ")) {
    return `Interesting Case-${criteriaKey.slice("Interesting Case - ".length)} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}
