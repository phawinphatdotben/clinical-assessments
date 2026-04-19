export type WpbaFormSlug = "dops" | "extern" | "jc" | "msf" | "cbd" | "minicex";

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
