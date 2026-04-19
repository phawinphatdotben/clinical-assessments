/**
 * Case-Based Discussion (CbD) — Needs improvement (1) … Excellent (4) ตามแบบประเมิน Ver 2
 */
export const CBD_SCORE_TIERS_BY_CRITERION: Record<
  string,
  readonly [number, number, number, number]
> = {
  "CbD - Data Gathering & Presentation": [1, 2, 3, 4],
  "CbD - Problem Summarization": [1, 2, 3, 4],
  "CbD - Diagnosis & Diff Dx": [1, 2, 3, 4],
  "CbD - Investigations": [1, 2, 3, 4],
  "CbD - Management & Prevention": [1, 2, 3, 4],
};

export const CBD_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

/** Supabase: "CbD - …" → "CbD-… SCORE" */
export function getCbdScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("CbD - ")) {
    const rest = criteriaKey.slice("CbD - ".length);
    return `CbD-${rest} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}

export function getCbdScoreTiers(criteriaKey: string): readonly [number, number, number, number] {
  const tiers = CBD_SCORE_TIERS_BY_CRITERION[criteriaKey];
  if (tiers) {
    return tiers;
  }
  return [1, 2, 3, 4];
}

/** เกณฑ์ 4 ระดับ (ภาษาไทย สรุปจากหัวตารางและคำอธิบายในแบบฟอร์ม) */
export const CBD_GENERIC_SCALE_RUBRIC_THAI: readonly {
  title: string;
  lines: readonly string[];
}[] = [
  {
    title: "Needs improvement (1) — ต้องปรับปรุง",
    lines: [
      "แสดงทักษะในระดับต่ำที่สุดของหัวข้อนั้น เช่น ข้อมูลไม่ครบหรือเรียงลำดับผิดมาก จนส่งผลต่อการวินิจฉัยหรือการดูแลตามเกณฑ์ของแต่ละหมวด",
    ],
  },
  {
    title: "Borderline (2) — พอใช้",
    lines: [
      "มีข้อบกพร่องที่ส่งผลต่อการวินิจฉัยหรือการวางแผน แต่ยังมีบางส่วนที่ยอมรับได้หรือปรับปรุงได้เมื่อมีคำแนะนำ",
    ],
  },
  {
    title: "Good (3) — ดี",
    lines: [
      "แสดงทักษะได้ถูกต้องและเพียงพอต่อการวินิจฉัย/แผนการดูแลเป็นส่วนใหญ่ อาจตกหล่นเล็กน้อยในรายละเอียดรอง",
    ],
  },
  {
    title: "Excellent (4) — ดีเยี่ยม",
    lines: [
      "แสดงทักษะได้ครบถ้วน ถูกต้อง และมีเหตุผลสนับสนุน สอดคล้องกับเกณฑ์สูงสุดของหัวข้อนั้น",
    ],
  },
];

export const CBD_CRITERION_RUBRIC_THAI: Record<string, string> = {
  "CbD - Data Gathering & Presentation":
    "รวบรวมและนำเสนอข้อมูลสำคัญ เช่น ประวัติ การตรวจร่างกาย ผลการตรวจทางห้องปฏิบัติการ — ครบถ้วน ถูกต้อง และเรียงลำดับเหมาะสมต่อการวินิจฉัย",

  "CbD - Problem Summarization":
    "สรุปปัญหาของผู้ป่วย: ระบุประเด็นสำคัญ จัดกลุ่มปัญหา และเชื่อมโยงไปสู่การวินิจฉัยได้อย่างสมเหตุสมผล",

  "CbD - Diagnosis & Diff Dx":
    "วินิจฉัยและวินิจฉัยแยกโรค: ให้การวินิจฉัยที่สมเหตุสมผล แยกโรคที่สำคัญได้ พร้อมเหตุผลที่เหมาะสม",

  "CbD - Investigations":
    "ส่งตรวจเพิ่มเติมเพื่อการวินิจฉัย และ/หรือ ประเมินความรุนแรง: เลือกการส่งตรวจเหมาะสม แปลผลถูกต้อง ไม่มากหรือน้อยเกินความจำเป็น",

  "CbD - Management & Prevention":
    "การรักษา การป้องกันและฟื้นฟูโรค: วางแผนการรักษาได้ครบถ้วน รวมถึงการป้องกันและการดูแลระยะยาวตามความเหมาะสม",
};
