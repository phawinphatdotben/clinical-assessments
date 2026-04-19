/**
 * Extern Clinical Assessment: rubric scores from the official form (per category).
 * Order: Need improvement → Borderline → Good → Excellent.
 */
export const EXTERN_SCORE_TIERS_BY_CRITERION: Record<
  string,
  readonly [number, number, number, number]
> = {
  "Extern - History Taking": [4, 8, 12, 15],
  "Extern - Physical Exam": [4, 8, 12, 15],
  "Extern - Diagnosis & Diff Dx": [5, 10, 15, 20],
  "Extern - Management Plan": [10, 20, 30, 40],
  "Extern - Communication Skills": [1, 2, 4, 5],
  "Extern - Professionalism": [1, 2, 4, 5],
};

export const EXTERN_TIER_LABELS = [
  "Need improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

/**
 * Supabase column for the numeric score, e.g.
 * "Extern - History Taking" → "Extern-History Taking SCORE"
 */
export function getExternScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("Extern - ")) {
    const rest = criteriaKey.slice("Extern - ".length);
    return `Extern-${rest} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}

export function getExternScoreTiers(criteriaKey: string): readonly [
  number,
  number,
  number,
  number,
] {
  const tiers = EXTERN_SCORE_TIERS_BY_CRITERION[criteriaKey];
  if (tiers) {
    return tiers;
  }
  return [0, 0, 0, 0];
}
