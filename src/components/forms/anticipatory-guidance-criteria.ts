export const ANTICIPATORY_GUIDANCE_FORM_TYPE = "Anticipatory Guidance Assessment" as const;

export const ANTICIPATORY_GUIDANCE_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

const ANTICIPATORY_GUIDANCE_TIERS: Record<string, readonly [number, number, number, number]> = {
  "Anticipatory Guidance - History": [7.5, 15, 22.5, 30],
  "Anticipatory Guidance - Physical examination": [5, 10, 15, 20],
  "Anticipatory Guidance - Problem list": [5, 10, 15, 20],
  "Anticipatory Guidance - Management and anticipatory guidance": [7.5, 15, 22.5, 30],
};

export function getAnticipatoryGuidanceScoreTiers(
  criteriaKey: string
): readonly [number, number, number, number] {
  return ANTICIPATORY_GUIDANCE_TIERS[criteriaKey] ?? [0, 0, 0, 0];
}

export function getAnticipatoryGuidanceScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("Anticipatory Guidance - ")) {
    return `Anticipatory Guidance-${criteriaKey.slice("Anticipatory Guidance - ".length)} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}
