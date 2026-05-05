export type RubricLink = {
  title: string;
  url: string;
};

type DopsProcedureRubric = RubricLink & {
  aliases: string[];
};

function normalizeProcedureName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const DOPS_PROCEDURE_RUBRICS: DopsProcedureRubric[] = [
  {
    title: "DOPS ETT rubric",
    url: "/rubrics/dops-internal-medicine/dops-ett.pdf",
    aliases: [
      "ett",
      "endotracheal intubation",
      "endotracheal intubation adult",
      "endotracheal intubation ped",
      "et tube",
      "intubation",
    ],
  },
  {
    title: "DOPS IV access rubric",
    url: "/rubrics/dops-internal-medicine/dops-iv-access.pdf",
    aliases: [
      "iv access",
      "intravenous access",
      "peripheral iv access",
      "intravenous fluid infusion peripheral intravenous access",
      "iv insertion",
      "venous access",
    ],
  },
  {
    title: "DOPS Lumbar puncture rubric",
    url: "/rubrics/dops-internal-medicine/dops-lumbar-puncture.pdf",
    aliases: ["lumbar puncture", "lp", "spinal tap"],
  },
  {
    title: "DOPS Thoracocentesis rubric",
    url: "/rubrics/dops-internal-medicine/dops-thoracocentesis.pdf",
    aliases: ["thoracocentesis", "thoracentesis", "pleural tap"],
  },
  {
    title: "DOPS Abdominal paracentesis rubric",
    url: "/rubrics/dops-internal-medicine/dops-abdominal-paracentesis.pdf",
    aliases: ["abdominal paracentesis", "abd paracentesis", "paracentesis"],
  },
];

const DOPS_PRIMARY_ALIAS_SUGGESTIONS = [
  "endotracheal intubation",
  "iv access",
  "lumbar puncture",
  "thoracocentesis",
  "abdominal paracentesis",
] as const;

export function findDopsProcedureRubric(procedureNameRaw: string): RubricLink | null {
  const normalized = normalizeProcedureName(procedureNameRaw);
  if (!normalized) {
    return null;
  }
  for (const rubric of DOPS_PROCEDURE_RUBRICS) {
    if (rubric.aliases.some((alias) => normalizeProcedureName(alias) === normalized)) {
      return { title: rubric.title, url: rubric.url };
    }
  }
  return null;
}

export function getDopsProcedureAliasSuggestions(): readonly string[] {
  return DOPS_PRIMARY_ALIAS_SUGGESTIONS;
}

const FORM_TYPE_RUBRICS: Record<string, RubricLink> = {
  "Internal Medicine Health Education": {
    title: "Internal Medicine Health Education rubric",
    url: "/rubrics/intmed-extern-health-education.pdf",
  },
  "Case Presentation": {
    title: "Case Presentation rubric",
    url: "/rubrics/extern-topic-presentation-rubric.pdf",
  },
  "Interesting Case Presentation": {
    title: "Interesting Case Presentation rubric",
    url: "/rubrics/extern-interesting-case-presentation-rubric.pdf",
  },
  "Interesting Case Presentation (General)": {
    title: "Interesting Case Presentation (General) rubric",
    url: "/rubrics/interesting-case-presentation-rubric.pdf",
  },
  "OPD Assessment": {
    title: "OPD Assessment rubric",
    url: "/rubrics/opd-assessment-ambuped.pdf",
  },
  "Anticipatory Guidance Assessment": {
    title: "Anticipatory Guidance rubric",
    url: "/rubrics/anticipatory-guidance-assessment.pdf",
  },
  "OR Assessment": {
    title: "OR Assessment rubric",
    url: "/rubrics/or-assessment-081167.pdf",
  },
  "OPD Clinical Assessment": {
    title: "OPD Clinical Assessment rubric",
    url: "/rubrics/opd-clinical-nonped.pdf",
  },
  "IPD Clinical Assessment": {
    title: "IPD Clinical Assessment rubric",
    url: "/rubrics/ipd-clinical.pdf",
  },
  "OB/GYNE Health Education": {
    title: "General Clinical Health Education template",
    url: "/rubrics/obgyn-health-education/template.pdf",
  },
};

export function getFormTypeRubric(formType: string): RubricLink | null {
  return FORM_TYPE_RUBRICS[formType] ?? null;
}
