export const OR_ASSESSMENT_FORM_TYPE = "OR Assessment" as const;

export const OR_ASSESSMENT_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

const OR_ASSESSMENT_TIERS: Record<string, readonly [number, number, number, number]> = {
  "OR Assessment - Surgical patient data": [2.5, 5, 7.5, 10],
  "OR Assessment - Disease background": [3, 7, 11, 15],
  "OR Assessment - Surgical procedure knowledge": [3, 7, 11, 15],
  "OR Assessment - Sterile technique": [5, 10, 15, 20],
  "OR Assessment - Operative field participation": [7, 15, 22, 30],
  "OR Assessment - Professionalism checklist": [2, 4, 8, 10],
};

export function getOrAssessmentScoreTiers(criteriaKey: string): readonly [number, number, number, number] {
  return OR_ASSESSMENT_TIERS[criteriaKey] ?? [0, 0, 0, 0];
}

export function getOrAssessmentScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("OR Assessment - ")) {
    return `OR Assessment-${criteriaKey.slice("OR Assessment - ".length)} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}
