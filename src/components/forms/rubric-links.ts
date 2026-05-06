export type RubricLink = {
  title: string;
  url: string;
};

export type ClinicalDepartmentRotationKey =
  | "Internal Medicine"
  | "Pediatrics"
  | "Sx/Ortho/ER"
  | "OB/GYN"
  | "ComMed/FamMed"
  | (string & {});

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

function lookupProcedureInList(
  procedureNameRaw: string,
  list: readonly DopsProcedureRubric[]
): RubricLink | null {
  const normalized = normalizeProcedureName(procedureNameRaw);
  if (!normalized) {
    return null;
  }
  for (const rubric of list) {
    if (rubric.aliases.some((alias) => normalizeProcedureName(alias) === normalized)) {
      return { title: rubric.title, url: rubric.url };
    }
  }
  return null;
}

const DOPS_PROCEDURE_CORE_RUBRICS: DopsProcedureRubric[] = [
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

/** Sx / Ortho / ER procedures (trauma FAST, surgery, orthopaedic skills). */
const DOPS_PROCEDURE_SX_ORTHO_ER_ONLY: DopsProcedureRubric[] = [
  {
    title: "DOPS FAST in trauma patients rubric",
    url: "/rubrics/dops-sx-ortho-er/dops-fast-in-trauma-patients.pdf",
    aliases: [
      "FAST in trauma patients",
      "fast in trauma patients",
      "fast trauma",
      "focused assessment with sonography for trauma",
      "fast scan",
      "e fast",
    ],
  },
  {
    title: "DOPS excision (surgery) rubric",
    url: "/rubrics/dops-sx-ortho-er/dops-excision-surgery.docx",
    aliases: [
      "Excision (surgery)",
      "excision surgery",
      "dops excision",
      "excision",
      "surgical excision",
      "minor excision",
    ],
  },
  {
    title: "DOPS digital nerve block rubric",
    url: "/rubrics/dops-sx-ortho-er/dops-digital-nerve-block.pdf",
    aliases: ["Digital nerve block", "digital nerve block", "dnb", "digital block"],
  },
  {
    title: "DOPS short arm slab rubric",
    url: "/rubrics/dops-sx-ortho-er/dops-short-arm-slab.pdf",
    aliases: ["Short arm slab", "short arm slab", "short arm plaster", "below elbow slab"],
  },
  {
    title: "DOPS skin traction rubric",
    url: "/rubrics/dops-sx-ortho-er/dops-skin-traction.pdf",
    aliases: ["Skin traction", "skin traction", "orthopaedic skin traction"],
  },
];

const DOPS_PROCEDURE_PEDIATRICS_ONLY: DopsProcedureRubric[] = [
  {
    title: "DOPS UAC/UVC insertion rubric",
    url: "/rubrics/dops-pediatrics/dops-uac-uvc-insertion.pdf",
    aliases: [
      "uac uvc insertion",
      "uac/uvc insertion",
      "uac insertion",
      "uvc insertion",
      "umbilical artery catheter",
      "umbilical arterial catheter",
      "umbilical venous catheter",
      "umbilical vein catheter",
    ],
  },
];

const DOPS_PROCEDURE_OB_GYN_ONLY: DopsProcedureRubric[] = [
  {
    title: "DOPS PAP smear rubric",
    url: "/rubrics/dops-obgyn/dops-pap-smear.docx",
    aliases: ["pap smear", "pap smear collection", "pap smear test", "cervical smear"],
  },
  {
    title: "DOPS vaginal packing rubric",
    url: "/rubrics/dops-obgyn/dops-vaginal-packing.docx",
    aliases: ["vaginal packing", "vaginal pack", "vaginal tamponade"],
  },
  {
    title: "DOPS IUD insertion rubric",
    url: "/rubrics/dops-obgyn/dops-iud-insertion.pdf",
    aliases: ["iud insertion", "insert iud", "intrauterine device insertion", "copper t insertion"],
  },
  {
    title: "DOPS contraceptive implant removal rubric",
    url: "/rubrics/dops-obgyn/dops-contraceptive-implant-removal.pdf",
    aliases: [
      "contraceptive implant removal",
      "implant removal",
      "etonogestrel implant removal",
      "jadelle removal",
      "implanon removal",
    ],
  },
];

/** Department-specific overlays; rotations not listed fall back to Internal Medicine PDFs first. */
const DOPS_ROTATION_SPECIFIC_RUBRICS: Partial<Record<ClinicalDepartmentRotationKey, DopsProcedureRubric[]>> = {
  Pediatrics: DOPS_PROCEDURE_PEDIATRICS_ONLY,
  "OB/GYN": DOPS_PROCEDURE_OB_GYN_ONLY,
  "Sx/Ortho/ER": DOPS_PROCEDURE_SX_ORTHO_ER_ONLY,
  "ComMed/FamMed": [],
};

/** Internal Medicine canonical list — also used as the default fallback for other rotations for shared procedures. */
const DOPS_IM_RUBRICS: readonly DopsProcedureRubric[] = DOPS_PROCEDURE_CORE_RUBRICS;

const DOPS_PRIMARY_ALIAS_SUGGESTIONS_INTERNAL_MEDICINE = [
  "thoracocentesis",
  "lumbar puncture",
  "IV access",
  "Endotracheal intubation",
  "Abdominal paracentesis",
] as const;

const DOPS_PRIMARY_ALIAS_SUGGESTIONS_PEDIATRICS = [
  "UAC/UVC insertion",
  "Endotracheal intubation",
  "IV access",
  "lumbar puncture",
] as const;

const DOPS_PRIMARY_ALIAS_SUGGESTIONS_SX_ORTHO_ER = [
  "FAST in trauma patients",
  "Excision (surgery)",
  "Digital nerve block",
  "Short arm slab",
  "Skin traction",
] as const;

const DOPS_PRIMARY_ALIAS_SUGGESTIONS_OB_GYN = [
  "PAP smear",
  "Vaginal packing",
  "IUD insertion",
  "Contraceptive implant removal",
] as const;

function buildDeptProcedureList(deptRaw: string | undefined): readonly DopsProcedureRubric[] {
  const key = (deptRaw ?? "").trim() as ClinicalDepartmentRotationKey;
  const extra = key ? DOPS_ROTATION_SPECIFIC_RUBRICS[key] : undefined;
  if (extra?.length) {
    return [...extra, ...DOPS_IM_RUBRICS];
  }
  return DOPS_IM_RUBRICS;
}

/**
 * Resolved rubric shipped with the app for `(procedure × department rotation)`.
 * Logbook/catalog PDF URLs (`rubric_pdf_url`) override this where present in UI.
 */
export function findStaticDopsProcedureRubric(procedureNameRaw: string, departmentRotation?: string): RubricLink | null {
  const dept = departmentRotation?.trim();
  const inDept = dept ? lookupProcedureInList(procedureNameRaw, buildDeptProcedureList(dept)) : null;
  if (inDept) {
    return inDept;
  }
  return lookupProcedureInList(procedureNameRaw, DOPS_IM_RUBRICS);
}

/** @deprecated Use {@link findStaticDopsProcedureRubric} — kept for callers without rotation context (falls back to IM). */
export function findDopsProcedureRubric(procedureNameRaw: string): RubricLink | null {
  return findStaticDopsProcedureRubric(procedureNameRaw, "Internal Medicine");
}

export function getDopsProcedureAliasSuggestions(departmentRotation?: string): readonly string[] {
  const d = (departmentRotation ?? "").trim();
  if (d === "Pediatrics") {
    return DOPS_PRIMARY_ALIAS_SUGGESTIONS_PEDIATRICS;
  }
  if (d === "Sx/Ortho/ER") {
    return DOPS_PRIMARY_ALIAS_SUGGESTIONS_SX_ORTHO_ER;
  }
  if (d === "OB/GYN") {
    return DOPS_PRIMARY_ALIAS_SUGGESTIONS_OB_GYN;
  }
  return DOPS_PRIMARY_ALIAS_SUGGESTIONS_INTERNAL_MEDICINE;
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
