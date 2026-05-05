export type WpbaFormSlug =
  | "dops"
  | "extern"
  | "jc"
  | "msf"
  | "cbd"
  | "minicex"
  | "health-ed-im"
  | "case-presentation"
  | "interesting-case"
  | "opd-assessment"
  | "opd-clinical"
  | "ipd-clinical"
  | "interesting-case-general"
  | "anticipatory-guidance"
  | "or-assessment"
  | "health-ed-obgyn";

export type WpbaFormConfig = {
  slug: WpbaFormSlug;
  title: string;
  formType: string;
  criteriaSectionTitle: string;
  criteriaKeys: string[];
  overallPerformanceKey?: string;
  overallPerformanceOptions?: string[];
};

export const WPBA_FORM_CONFIGS: WpbaFormConfig[] = [
  {
    slug: "dops",
    title: "DOPS",
    formType: "DOPS",
    criteriaSectionTitle: "DOPS Criteria",
    criteriaKeys: [
      "DOPS - Before: Indications/Complications",
      "DOPS - Before: Consent",
      "DOPS - Before: Preparation",
      "DOPS - During: Patient Comfort",
      "DOPS - During: Procedure Steps",
      "DOPS - During: Aseptic",
      "DOPS - During: Problem Solving",
      "DOPS - After: Post-procedure Care",
      "DOPS - After: Communication",
      "DOPS - Patient Empathy",
      "DOPS - Pre Performance practice preparation",
    ],
    overallPerformanceKey: "DOPS - Overall Performance",
    overallPerformanceOptions: ["Pass", "Fail"],
  },
  {
    slug: "extern",
    title: "Extern Clinical Assessment",
    formType: "Extern Clinical Assessment",
    criteriaSectionTitle: "Extern Clinical Assessment Criteria",
    criteriaKeys: [
      "Extern - History Taking",
      "Extern - Physical Exam",
      "Extern - Diagnosis & Diff Dx",
      "Extern - Management Plan",
      "Extern - Communication Skills",
      "Extern - Professionalism",
    ],
  },
  {
    slug: "health-ed-im",
    title: "Internal Medicine Health Education",
    formType: "Internal Medicine Health Education",
    criteriaSectionTitle:
      "ส่วนที่ 1–2 · แบบประเมินทักษะการให้ความรู้ (Health education) & Communication / Professionalism",
    criteriaKeys: [
      "IM Health Ed - Assess baseline",
      "IM Health Ed - Information delivery",
      "IM Health Ed - Teach-back and engagement",
      "IM Health Ed - Empowerment and shared planning",
      "IM Health Ed - Communication skills (patient)",
      "IM Health Ed - Professionalism checklist",
    ],
  },
  {
    slug: "case-presentation",
    title: "Case Presentation",
    formType: "Case Presentation",
    criteriaSectionTitle: "Case Presentation Rubric Criteria",
    criteriaKeys: [
      "Case Presentation - Content and currency",
      "Case Presentation - Evidence appraisal",
      "Case Presentation - Clinical application",
      "Case Presentation - Teaching media",
      "Case Presentation - Presentation skills",
    ],
  },
  {
    slug: "interesting-case",
    title: "Interesting Case Presentation",
    formType: "Interesting Case Presentation",
    criteriaSectionTitle: "Interesting Case Presentation Rubric Criteria",
    criteriaKeys: [
      "Interesting Case - Patient summary",
      "Interesting Case - Clinical diagnosis process",
      "Interesting Case - Management and holistic care",
      "Interesting Case - Discussion",
      "Interesting Case - Presentation media and delivery",
    ],
  },
  {
    slug: "interesting-case-general",
    title: "Interesting Case Presentation (General)",
    formType: "Interesting Case Presentation (General)",
    criteriaSectionTitle: "Interesting Case Presentation (General) Rubric Criteria",
    criteriaKeys: [
      "Interesting Case General - Patient summary",
      "Interesting Case General - Clinical diagnosis process",
      "Interesting Case General - Management and holistic care",
      "Interesting Case General - Discussion",
      "Interesting Case General - Presentation media and delivery",
    ],
  },
  {
    slug: "opd-assessment",
    title: "OPD Assessment",
    formType: "OPD Assessment",
    criteriaSectionTitle: "OPD Assessment Rubric Criteria",
    criteriaKeys: [
      "OPD Assessment - History",
      "OPD Assessment - Physical examination",
      "OPD Assessment - Problem list",
      "OPD Assessment - Provisional diagnosis",
      "OPD Assessment - Differential diagnosis and discussion",
      "OPD Assessment - Investigation and interpretation",
      "OPD Assessment - Management plan",
    ],
    overallPerformanceKey: "OPD Assessment - Overall result",
    overallPerformanceOptions: ["Pass", "Fail"],
  },
  {
    slug: "opd-clinical",
    title: "OPD Clinical Assessment",
    formType: "OPD Clinical Assessment",
    criteriaSectionTitle: "OPD Clinical Assessment Rubric Criteria",
    criteriaKeys: [
      "OPD Clinical - Foundation knowledge",
      "OPD Clinical - Clinical evaluation",
      "OPD Clinical - Clinical reasoning and planning",
      "OPD Clinical - Management and follow-up",
      "OPD Clinical - Communication skills",
      "OPD Clinical - Professionalism checklist",
    ],
    overallPerformanceKey: "OPD Clinical - Overall Performance",
    overallPerformanceOptions: ["Fail", "Borderline", "Pass"],
  },
  {
    slug: "ipd-clinical",
    title: "IPD Clinical Assessment",
    formType: "IPD Clinical Assessment",
    criteriaSectionTitle: "IPD Clinical Assessment Rubric Criteria",
    criteriaKeys: [
      "IPD Clinical - Clinical data and monitoring",
      "IPD Clinical - Case presentation (SOAP)",
      "IPD Clinical - Clinical reasoning and management",
      "IPD Clinical - Procedural skill",
      "IPD Clinical - Responsibility and punctuality",
      "IPD Clinical - Clinical initiative and learning",
      "IPD Clinical - Communication and interpersonal",
      "IPD Clinical - Ethics and professional conduct",
    ],
    overallPerformanceKey: "IPD Clinical - Overall Performance",
    overallPerformanceOptions: ["Fail", "Borderline", "Pass"],
  },
  {
    slug: "anticipatory-guidance",
    title: "Anticipatory Guidance Assessment",
    formType: "Anticipatory Guidance Assessment",
    criteriaSectionTitle: "Anticipatory Guidance Rubric Criteria",
    criteriaKeys: [
      "Anticipatory Guidance - History",
      "Anticipatory Guidance - Physical examination",
      "Anticipatory Guidance - Problem list",
      "Anticipatory Guidance - Management and anticipatory guidance",
    ],
    overallPerformanceKey: "Anticipatory Guidance - Overall result",
    overallPerformanceOptions: ["Pass", "Fail"],
  },
  {
    slug: "or-assessment",
    title: "OR Assessment",
    formType: "OR Assessment",
    criteriaSectionTitle: "OR Assessment Rubric Criteria",
    criteriaKeys: [
      "OR Assessment - Surgical patient data",
      "OR Assessment - Disease background",
      "OR Assessment - Surgical procedure knowledge",
      "OR Assessment - Sterile technique",
      "OR Assessment - Operative field participation",
      "OR Assessment - Professionalism checklist",
    ],
    overallPerformanceKey: "OR Assessment - Overall Performance",
    overallPerformanceOptions: ["Fail", "Borderline", "Pass"],
  },
  {
    slug: "health-ed-obgyn",
    title: "OB/GYNE Health Education",
    formType: "OB/GYNE Health Education",
    criteriaSectionTitle: "General Clinical Health Education Criteria",
    criteriaKeys: [
      "OB/GYNE Health Ed - Introduction",
      "OB/GYNE Health Ed - Foundation",
      "OB/GYNE Health Ed - Technical instructions",
      "OB/GYNE Health Ed - Lifestyle advice",
      "OB/GYNE Health Ed - Warning signs",
      "OB/GYNE Health Ed - Follow-up and questions",
    ],
    overallPerformanceKey: "OB/GYNE Health Education - Overall result",
    overallPerformanceOptions: ["Pass", "Fail"],
  },
  {
    slug: "jc",
    title: "Journal Conference",
    formType: "Journal Conference",
    criteriaSectionTitle: "Journal Conference Criteria",
    criteriaKeys: [
      "JC - 1.1 Rationale/Importance",
      "JC - 1.2 Methodology Overview",
      "JC - 1.3 Results Overview",
      "JC - 1.4 Discussion & Conclusion",
      "JC - 2.1 Strengths & Limitations",
      "JC - 2.2 Clinical Application",
      "JC - 2.3 Further Studies Needed",
      "JC - 2.4 Review & Summary",
      "JC - 3.1 Preparation & Materials",
      "JC - 3.2 Presentation Skills",
      "JC - 3.3 Time Management",
      "JC - 4.0 Ability to Answer Questions",
    ],
  },
  {
    slug: "msf",
    title: "Multisource Feedback",
    formType: "Multisource Feedback",
    criteriaSectionTitle: "Multisource Feedback Criteria",
    criteriaKeys: [
      "MSF - Continuous Prof. Development (C)",
      "MSF - Research & Innovation (R)",
      "MSF - Resilience (R)",
      "MSF - Altruism (A)",
      "MSF - Mastery (M)",
      "MSF - Digital Literacy (D)",
      "MSF - Professionalism (P)",
      "MSF - Humility & Volunteerism (H)",
    ],
  },
  {
    slug: "cbd",
    title: "Case-Based Discussion",
    formType: "Case-Based Discussion",
    criteriaSectionTitle: "Case-Based Discussion Criteria",
    criteriaKeys: [
      "CbD - Data Gathering & Presentation",
      "CbD - Problem Summarization",
      "CbD - Diagnosis & Diff Dx",
      "CbD - Investigations",
      "CbD - Management & Prevention",
    ],
    overallPerformanceKey: "CbD - Overall performance",
    overallPerformanceOptions: ["Pass", "Fail"],
  },
  {
    slug: "minicex",
    title: "MiniCEX",
    formType: "MiniCEX",
    criteriaSectionTitle: "MiniCEX Criteria",
    criteriaKeys: [
      "MiniCEX - History Taking",
      "MiniCEX - Physical Exam",
      "MiniCEX - Diagnosis & Diff Dx",
      "MiniCEX - Investigations",
      "MiniCEX - Management Plan",
      "MiniCEX - Patient Education/Counseling",
      "MiniCEX - Communication Skills",
      "MiniCEX - Professionalism",
    ],
    overallPerformanceKey: "MiniCEX - Over all performance",
    overallPerformanceOptions: ["Pass", "Fail"],
  },
];

export const getWpbaFormConfigBySlug = (slug: string): WpbaFormConfig | undefined => {
  return WPBA_FORM_CONFIGS.find((config) => config.slug === slug);
};
