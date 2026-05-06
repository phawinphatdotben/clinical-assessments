import type { WpbaFormSlug } from "../../components/forms/wpba-config";

/** Year 7 folder — printable rubrics / originals; paste per-form links in `rubricDriveUrl` when you have them. */
export const YEAR7_CLINICAL_FORMS_DRIVE_URL =
  "https://drive.google.com/drive/folders/1nZMWN_zaCRNzvl1bO5mk-vQnF24zLA4N?usp=drive_link";

export const CLINICAL_DEPARTMENTS = [
  {
    rotationKey: "Internal Medicine",
    label: "Internal Medicine (Int Med)",
    shortLabel: "Int Med",
  },
  {
    rotationKey: "Pediatrics",
    label: "Pediatrics (Ped)",
    shortLabel: "Ped",
  },
  {
    rotationKey: "Sx/Ortho/ER",
    label: "Surgery / Orthopedics / ER",
    shortLabel: "Ortho/Sx/ER",
  },
  {
    rotationKey: "OB/GYN",
    label: "Obstetrics & Gynecology (OB/GYNE)",
    shortLabel: "OB/GYNE",
  },
  {
    rotationKey: "ComMed/FamMed",
    label: "Community & Family Medicine (Com Med / Fam Med)",
    shortLabel: "Com Med/Fam Med",
  },
] as const;

export type ClinicalDepartmentRotation = (typeof CLINICAL_DEPARTMENTS)[number]["rotationKey"];

export const CLINICAL_DEPARTMENT_ROTATIONS: ClinicalDepartmentRotation[] = CLINICAL_DEPARTMENTS.map(
  (d) => d.rotationKey,
);

/** One curriculum-facing row: always submits via in-app WPBA; Drive is rubric/reference only. */
export type DepartmentFormOffer = {
  id: string;
  label: string;
  detail?: string;
  wpbaSlug: WpbaFormSlug;
  /** Rubric: full URL, or app path e.g. `/rubrics/….pdf` (served from `public/`). Defaults to Year 7 Drive when omitted. */
  rubricDriveUrl?: string;
  /** Set true only if this row must not offer a Drive shortcut. */
  hideRubricLink?: boolean;
};

function appOffer(
  id: string,
  label: string,
  slug: WpbaFormSlug,
  opts?: Pick<DepartmentFormOffer, "detail" | "rubricDriveUrl" | "hideRubricLink">,
): DepartmentFormOffer {
  return {
    id,
    label,
    wpbaSlug: slug,
    ...opts,
  };
}

/**
 * Department → labelled evaluations (all open in-app). Drive links are references only (`rubricDriveUrl`).
 *
 * Rows that were formerly “Drive-only” map to the closest WPBA in this codebase; tweak slugs per local policy if needed.
 */
export const DEPARTMENT_FORM_OFFERS: Record<ClinicalDepartmentRotation, DepartmentFormOffer[]> = {
  "Internal Medicine": [
    appOffer("im-minicex", "MINI-CEX", "minicex"),
    appOffer("im-cbd", "Case-based Discussion (CbD)", "cbd"),
    appOffer("im-health-ed", "Health Education (Int Med)", "health-ed-im", {
      detail: "Electronic form matches CHMD 7403 health education rubric (assess baseline, teach-back, etc.).",
      rubricDriveUrl: "/rubrics/intmed-extern-health-education.pdf",
    }),
    appOffer("im-dops", "DOPS", "dops", {
      detail: "Examples: thoracocentesis, lumbar puncture, IV access, ETT, abdominal paracentesis — pick procedure on the form.",
    }),
    appOffer("im-ipd", "IPD Clinical Assessment", "ipd-clinical", {
      detail: "In-app IPD clinical assessment (non-pediatric IPD rubric).",
      rubricDriveUrl: "/rubrics/ipd-clinical.pdf",
    }),
    appOffer("im-jc", "Journal Club", "jc"),
    appOffer("im-case-presentation", "Case Presentation", "case-presentation", {
      rubricDriveUrl: "/rubrics/extern-topic-presentation-rubric.pdf",
    }),
    appOffer("im-interesting-case-general", "Interesting Case Presentation", "interesting-case-general", {
      rubricDriveUrl: "/rubrics/interesting-case-presentation-rubric.pdf",
    }),
    appOffer("im-opd-clinical", "OPD Clinical Assessment", "opd-clinical", {
      detail: "In-app non-pediatric OPD clinical assessment.",
      rubricDriveUrl: "/rubrics/opd-clinical-nonped.pdf",
    }),
  ],
  Pediatrics: [
    appOffer("ped-dops", "DOPS", "dops", {
      detail:
        "Pediatric procedures — choose the procedure name on the form; skills catalog can be scoped by Pediatrics rotation when configured in Supabase.",
    }),
    appOffer("ped-cbd", "Case-based Discussion (CbD)", "cbd"),
    appOffer("ped-minicex", "MINI-CEX", "minicex"),
    appOffer("ped-jc", "Journal Club", "jc"),
    appOffer("ped-case-presentation", "Case Presentation", "case-presentation", {
      rubricDriveUrl: "/rubrics/extern-topic-presentation-rubric.pdf",
    }),
    appOffer("ped-interesting-case-general", "Interesting Case Presentation", "interesting-case-general", {
      rubricDriveUrl: "/rubrics/interesting-case-presentation-rubric.pdf",
    }),
    appOffer("ped-opd-assessment", "OPD Assessment", "opd-assessment", {
      rubricDriveUrl: "/rubrics/opd-assessment-ambuped.pdf",
    }),
    appOffer("ped-anticipatory-guidance", "Anticipatory Guidance Assessment", "anticipatory-guidance", {
      rubricDriveUrl: "/rubrics/anticipatory-guidance-assessment.pdf",
    }),
  ],
  "OB/GYN": [
    appOffer("ob-health-ed", "Health Education (OB/GYNE)", "health-ed-obgyn", {
      detail: "General template with topic-based rubric (breastfeeding, contraceptives, postpartum, post-op TAH c BSO).",
      rubricDriveUrl: "/rubrics/obgyn-health-education/template.pdf",
    }),
    appOffer("ob-dops", "DOPS Obstetrics", "dops", {
      detail: "Obstetric procedures — select procedure on the submission form.",
    }),
    appOffer("ob-msf", "MSF Evaluation", "msf"),
    appOffer("ob-cbd", "CbD", "cbd"),
    appOffer("ob-minicex", "MINI-CEX", "minicex"),
    appOffer("ob-or-assessment", "OR Assessment", "or-assessment", {
      rubricDriveUrl: "/rubrics/or-assessment-081167.pdf",
    }),
    appOffer("ob-interesting-case-general", "Interesting Case Presentation", "interesting-case-general", {
      rubricDriveUrl: "/rubrics/interesting-case-presentation-rubric.pdf",
    }),
    appOffer("ob-opd-clinical", "OPD Clinical Assessment", "opd-clinical", {
      rubricDriveUrl: "/rubrics/opd-clinical-nonped.pdf",
    }),
    appOffer("ob-ipd-clinical", "IPD Clinical Assessment", "ipd-clinical", {
      rubricDriveUrl: "/rubrics/ipd-clinical.pdf",
    }),
  ],
  "Sx/Ortho/ER": [
    appOffer("sx-or", "OR Assessment", "or-assessment", {
      detail: "Dedicated OR assessment form based on clinical OR rubric.",
      rubricDriveUrl: "/rubrics/or-assessment-081167.pdf",
    }),
    appOffer("sx-dops", "DOPS", "dops", {
      detail:
        "Sx/Ortho/ER procedures with department rubrics: FAST (trauma), excision (surgery), digital nerve block, short arm slab, skin traction — select procedure name on the form (rotation Sx/Ortho/ER).",
    }),
    appOffer("sx-topic", "Topic Presentation", "jc", {
      detail: "Topic presentations — Journal Conference form if that matches attachment policy.",
    }),
    appOffer("sx-minicex", "MINI-CEX", "minicex"),
    appOffer("sx-cbd", "Case-based Discussion", "cbd"),
    appOffer("sx-jc", "Journal Club", "jc"),
    appOffer("sx-case-presentation", "Case Presentation", "case-presentation", {
      rubricDriveUrl: "/rubrics/extern-topic-presentation-rubric.pdf",
    }),
    appOffer("sx-interesting-case-general", "Interesting Case Presentation", "interesting-case-general", {
      rubricDriveUrl: "/rubrics/interesting-case-presentation-rubric.pdf",
    }),
    appOffer("sx-opd-clinical", "OPD Clinical Assessment", "opd-clinical", {
      rubricDriveUrl: "/rubrics/opd-clinical-nonped.pdf",
    }),
    appOffer("sx-ipd-clinical", "IPD Clinical Assessment", "ipd-clinical", {
      rubricDriveUrl: "/rubrics/ipd-clinical.pdf",
    }),
  ],
  "ComMed/FamMed": [
    appOffer("cm-home", "Home Visit (NCD / Palliative)", "minicex"),
    appOffer("cm-opd", "OPD Record Form", "minicex", {
      detail: "Outpatient evaluation — documented as MiniCEX-style attachment.",
    }),
    appOffer("cm-msf", "Multi-source feedback (MSF)", "msf"),
    appOffer("cm-oral", "Oral Presentation", "jc"),
    appOffer("cm-minicex", "MINI-CEX", "minicex"),
    appOffer("cm-case-presentation", "Case Presentation", "case-presentation", {
      rubricDriveUrl: "/rubrics/extern-topic-presentation-rubric.pdf",
    }),
    appOffer("cm-interesting-case-general", "Interesting Case Presentation", "interesting-case-general", {
      rubricDriveUrl: "/rubrics/interesting-case-presentation-rubric.pdf",
    }),
    appOffer("cm-opd-clinical", "OPD Clinical Assessment", "opd-clinical", {
      rubricDriveUrl: "/rubrics/opd-clinical-nonped.pdf",
    }),
    appOffer("cm-ipd-clinical", "IPD Clinical Assessment", "ipd-clinical", {
      rubricDriveUrl: "/rubrics/ipd-clinical.pdf",
    }),
  ],
};

export function getFormOffersForDepartment(rotationKey: string): DepartmentFormOffer[] {
  const key = rotationKey.trim() as ClinicalDepartmentRotation;
  if (key && key in DEPARTMENT_FORM_OFFERS) {
    return DEPARTMENT_FORM_OFFERS[key];
  }
  return [];
}

export function getWpbaSlugsForFormOffers(offers: DepartmentFormOffer[]): WpbaFormSlug[] {
  const set = new Set<WpbaFormSlug>();
  for (const offer of offers) {
    set.add(offer.wpbaSlug);
  }
  return [...set];
}
