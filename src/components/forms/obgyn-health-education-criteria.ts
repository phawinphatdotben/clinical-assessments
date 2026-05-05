export const OBGYN_HEALTH_EDUCATION_FORM_TYPE = "OB/GYNE Health Education" as const;

export const OBGYN_HEALTH_EDUCATION_SCORE_LABELS = [
  "Not performed / incorrect",
  "Partially correct / needs improvement",
  "Complete / correct / professional",
] as const;

export const OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN = "Health Education Topic";

export const OBGYN_HEALTH_EDUCATION_TOPICS = [
  "Breastfeeding advice",
  "Contraceptives and family planning advice",
  "Postpartum care advice",
  "Advice post-op TAH c BSO",
] as const;

export const OBGYN_HEALTH_EDUCATION_WARNING_SIGNS_KEY = "OB/GYNE Health Ed - Warning signs";

const OBGYN_HEALTH_EDUCATION_TIERS: Record<string, readonly [number, number, number]> = {
  "OB/GYNE Health Ed - Introduction": [0, 1, 2],
  "OB/GYNE Health Ed - Foundation": [0, 3, 6],
  "OB/GYNE Health Ed - Technical instructions": [0, 5, 10],
  "OB/GYNE Health Ed - Lifestyle advice": [0, 2, 4],
  [OBGYN_HEALTH_EDUCATION_WARNING_SIGNS_KEY]: [0, 3, 6],
  "OB/GYNE Health Ed - Follow-up and questions": [0, 1, 2],
};

export function getObgynHealthEducationScoreTiers(
  criteriaKey: string
): readonly [number, number, number] {
  return OBGYN_HEALTH_EDUCATION_TIERS[criteriaKey] ?? [0, 1, 2];
}

export function isObgynHealthEducationWarningSignsKey(criteriaKey: string): boolean {
  return criteriaKey === OBGYN_HEALTH_EDUCATION_WARNING_SIGNS_KEY;
}

export const OBGYN_HEALTH_EDUCATION_MAX_SCORE = 30;
export const OBGYN_HEALTH_EDUCATION_PASSING_SCORE = 18;

export function getObgynHealthEducationScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("OB/GYNE Health Ed - ")) {
    return `OBGYN Health Ed-${criteriaKey.slice("OB/GYNE Health Ed - ".length)} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}

export function getObgynHealthEducationTopicRubric(topic: string): { title: string; url: string } | null {
  const normalized = topic.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === "breastfeeding advice") {
    return {
      title: "Health Education Y7 — Breastfeeding Advice",
      url: "/rubrics/obgyn-health-education/breastfeeding-advice.pdf",
    };
  }
  if (normalized === "contraceptives and family planning advice") {
    return {
      title: "Health Education Y7 — Contraceptives and Family Planning Advice",
      url: "/rubrics/obgyn-health-education/contraceptives-and-family-planning-advice.pdf",
    };
  }
  if (normalized === "postpartum care advice") {
    return {
      title: "Health Education Y7 — Postpartum Care Advice",
      url: "/rubrics/obgyn-health-education/postpartum-care-advice.pdf",
    };
  }
  if (normalized === "advice post-op tah c bso") {
    return {
      title: "Health Education Advice post-op TAH c BSO",
      url: "/rubrics/obgyn-health-education/post-op-tah-c-bso.pdf",
    };
  }
  return null;
}
