export const IPD_CLINICAL_FORM_TYPE = "IPD Clinical Assessment" as const;

export const IPD_CLINICAL_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

const IPD_CLINICAL_TIERS: Record<string, readonly [number, number, number, number]> = {
  "IPD Clinical - Clinical data and monitoring": [2.5, 5, 7.5, 10],
  "IPD Clinical - Case presentation (SOAP)": [4, 8, 12, 15],
  "IPD Clinical - Clinical reasoning and management": [4, 8, 12, 15],
  "IPD Clinical - Procedural skill": [2.5, 5, 7.5, 10],
  "IPD Clinical - Responsibility and punctuality": [4, 8, 12, 15],
  "IPD Clinical - Clinical initiative and learning": [2.5, 5, 7.5, 10],
  "IPD Clinical - Communication and interpersonal": [4, 8, 12, 15],
  "IPD Clinical - Ethics and professional conduct": [2.5, 5, 7.5, 10],
};

export function getIpdClinicalScoreTiers(criteriaKey: string): readonly [number, number, number, number] {
  return IPD_CLINICAL_TIERS[criteriaKey] ?? [1, 2, 3, 4];
}

export function getIpdClinicalScoreColumnName(criteriaKey: string): string {
  if (!criteriaKey.startsWith("IPD Clinical - ")) {
    return `${criteriaKey} SCORE`;
  }
  return `IPD Clinical-${criteriaKey.slice("IPD Clinical - ".length)} SCORE`;
}
