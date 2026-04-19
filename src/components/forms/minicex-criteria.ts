/**
 * MiniCEX — Needs improvement (1) … Excellent (4) ตามแบบประเมิน Ver 2
 */
export const MINICEX_SCORE_TIERS_BY_CRITERION: Record<
  string,
  readonly [number, number, number, number]
> = {
  "MiniCEX - History Taking": [1, 2, 3, 4],
  "MiniCEX - Physical Exam": [1, 2, 3, 4],
  "MiniCEX - Diagnosis & Diff Dx": [1, 2, 3, 4],
  "MiniCEX - Investigations": [1, 2, 3, 4],
  "MiniCEX - Management Plan": [1, 2, 3, 4],
  "MiniCEX - Patient Education/Counseling": [1, 2, 3, 4],
  "MiniCEX - Communication Skills": [1, 2, 3, 4],
  "MiniCEX - Professionalism": [1, 2, 3, 4],
};

export const MINICEX_TIER_LABELS = [
  "Needs improvement",
  "Borderline",
  "Good",
  "Excellent",
] as const;

/** "MiniCEX - …" → "MiniCEX-… SCORE" */
export function getMiniCexScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("MiniCEX - ")) {
    const rest = criteriaKey.slice("MiniCEX - ".length);
    return `MiniCEX-${rest} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}

export function getMiniCexScoreTiers(criteriaKey: string): readonly [number, number, number, number] {
  const tiers = MINICEX_SCORE_TIERS_BY_CRITERION[criteriaKey];
  if (tiers) {
    return tiers;
  }
  return [1, 2, 3, 4];
}

export const MINICEX_GENERIC_SCALE_RUBRIC_THAI: readonly {
  title: string;
  lines: readonly string[];
}[] = [
  {
    title: "Needs improvement (1)",
    lines: [
      "แสดงทักษะในระดับที่ต้องปรับปรุงอย่างมากตามเกณฑ์ของหัวข้อนั้น (เช่น ข้อมูลหรือทักษะไม่เพียงพอต่อการดูแลผู้ป่วย)",
    ],
  },
  {
    title: "Borderline (2)",
    lines: [
      "อยู่ระดับพอใช้ มีจุดที่ยังไม่ครบหรือไม่สม่ำเสมอ แต่ยังพัฒนาได้เมื่อมีคำแนะนำ",
    ],
  },
  {
    title: "Good (3)",
    lines: [
      "แสดงทักษะได้ดีตามเกณฑ์ทั่วไป เหมาะสมกับการดูแลผู้ป่วยในส่วนใหญ่ของหัวข้อ",
    ],
  },
  {
    title: "Excellent (4)",
    lines: [
      "แสดงทักษะได้ครบถ้วน ถูกต้อง และโดดเด่นตามเกณฑ์สูงสุดของหัวข้อนั้น",
    ],
  },
];

export const MINICEX_CRITERION_RUBRIC_THAI: Record<string, string> = {
  "MiniCEX - History Taking":
    "ซักประวัติ: ความครบถ้วนและลำดับของข้อมูลที่เพียงพอต่อการวินิจฉัยและการแยกโรค",

  "MiniCEX - Physical Exam":
    "ตรวจร่างกาย: ขั้นตอนและท่าทางการตรวจถูกต้อง ครบถ้วน และการรายงานผลการตรวจสอดคล้องกับความเป็นจริง",

  "MiniCEX - Diagnosis & Diff Dx":
    "วินิจฉัยและแยกโรค: การให้การวินิจฉัยที่สมเหตุสมผล พร้อมเหตุผลและการแยกโรคที่สำคัญ",

  "MiniCEX - Investigations":
    "ส่งตรวจเพิ่มเติมเพื่อการวินิจฉัย/ประเมินความรุนแรง: การเลือกส่งตรวจที่เหมาะสม แปลผลถูกต้อง ไม่มากหรือน้อยเกินความจำเป็น",

  "MiniCEX - Management Plan":
    "การรักษา การป้องกันและฟื้นฟู: การวางแผนการรักษาครบถ้วน รวมการป้องกันและการดูแลระยะยาวเมื่อเกี่ยวข้อง",

  "MiniCEX - Patient Education/Counseling":
    "ให้คำแนะนำผู้ป่วย และสรุปใจความสำคัญ/ทบทวนความเข้าใจของผู้ป่วย: ครบถ้วนชัดเจนและสอดคล้องกับปัญหา",

  "MiniCEX - Communication Skills":
    "การสื่อสาร (ผู้ป่วย/ญาติ/ผู้ประเมิน): ความชัดเจน การใช้ภาษาเหมาะสม และกิริยามารยาท",

  "MiniCEX - Professionalism":
    "ความเป็นมืออาชีพ: ตรงต่อเวลา แนะนำตัวและยืนยันตัวผู้ป่วย ขอความยินยอม วัตถุประสงค์การสนทนา สุภาพ และการแต่งกายเรียบร้อย (เกณฑ์ 0–6 ข้อในแบบฟอร์ม)",
};
