export const INTERESTING_CASE_GENERAL_FORM_TYPE = "Interesting Case Presentation (General)" as const;

export const INTERESTING_CASE_GENERAL_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

const INTERESTING_CASE_GENERAL_TIERS: Record<string, readonly [number, number, number, number]> = {
  "Interesting Case General - Patient summary": [3.75, 7.5, 11.25, 15],
  "Interesting Case General - Clinical diagnosis process": [7.5, 15, 22.5, 30],
  "Interesting Case General - Management and holistic care": [6.25, 12.5, 18.75, 25],
  "Interesting Case General - Discussion": [3.75, 7.5, 11.25, 15],
  "Interesting Case General - Presentation media and delivery": [3.75, 7.5, 11.25, 15],
};

export function getInterestingCaseGeneralScoreTiers(
  criteriaKey: string
): readonly [number, number, number, number] {
  return INTERESTING_CASE_GENERAL_TIERS[criteriaKey] ?? [0, 0, 0, 0];
}

export function getInterestingCaseGeneralScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("Interesting Case General - ")) {
    return `Interesting Case General-${criteriaKey.slice("Interesting Case General - ".length)} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}
