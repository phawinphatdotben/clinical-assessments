/**
 * Multisource Feedback (MSF) — ระดับคะแนน 1–4 ตามแบบประเมิน (มากที่สุด(4) … น้อยที่สุด(1))
 */
export const MSF_SCORE_TIERS_BY_CRITERION: Record<
  string,
  readonly [number, number, number, number]
> = {
  "MSF - Continuous Prof. Development (C)": [1, 2, 3, 4],
  "MSF - Research & Innovation (R)": [1, 2, 3, 4],
  "MSF - Resilience (R)": [1, 2, 3, 4],
  "MSF - Altruism (A)": [1, 2, 3, 4],
  "MSF - Mastery (M)": [1, 2, 3, 4],
  "MSF - Digital Literacy (D)": [1, 2, 3, 4],
  "MSF - Professionalism (P)": [1, 2, 3, 4],
  "MSF - Humility & Volunteerism (H)": [1, 2, 3, 4],
};

/** ป้ายระดับ (ต่ำ → สูง) ตรงกับคะแนน 1–4 */
export const MSF_TIER_LABELS_THAI = [
  "น้อยที่สุด",
  "น้อย",
  "มาก",
  "มากที่สุด",
] as const;

/** Supabase: "MSF - …" → "MSF-… SCORE" */
export function getMsfScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("MSF - ")) {
    const rest = criteriaKey.slice("MSF - ".length);
    return `MSF-${rest} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}

export function getMsfScoreTiers(criteriaKey: string): readonly [number, number, number, number] {
  const tiers = MSF_SCORE_TIERS_BY_CRITERION[criteriaKey];
  if (tiers) {
    return tiers;
  }
  return [1, 2, 3, 4];
}

/** คำอธิบายมาตรฐาน 4 ระดับ (ภาษาไทย สรุปจากแบบฟอร์ม) */
export const MSF_GENERIC_SCALE_RUBRIC_THAI: readonly {
  title: string;
  lines: readonly string[];
}[] = [
  {
    title: "น้อยที่สุด (1)",
    lines: [
      "แสดงออกในระดับที่ต่ำที่สุดตามเกณฑ์ของหัวข้อนั้น (เช่น ขาดทักษะ/ความรู้ที่คาดหวัง หรือต้องได้รับการช่วยเหลือ/กระตุ้นอย่างมาก)",
    ],
  },
  {
    title: "น้อย (2)",
    lines: [
      "แสดงออกในระดับต่ำกว่าเกณฑ์ที่พึงประสงค์ แต่ยังมีบางด้านที่พัฒนาได้เมื่อได้รับคำแนะนำหรือการชี้แนะ",
    ],
  },
  {
    title: "มาก (3)",
    lines: [
      "แสดงออกในระดับที่ยอมรับได้หรือดีตามเกณฑ์ทั่วไป สอดคล้องกับความคาดหวังของผู้ประเมินในส่วนใหญ่",
    ],
  },
  {
    title: "มากที่สุด (4)",
    lines: [
      "แสดงออกในระดับดีเยี่ยม โดดเด่น สอดคล้องกับคุณลักษณะบัณฑิตที่พึงประสงค์อย่างชัดเจน",
    ],
  },
];

export const MSF_CRITERION_RUBRIC_THAI: Record<string, string> = {
  "MSF - Continuous Prof. Development (C)":
    "C — พัฒนาวิชาชีพต่อเนื่อง: การเรียนรู้ด้วยตนเอง การค้นคว้า และการนำความรู้ไปใช้ดูแลผู้ป่วย รวมถึงความใฝ่รู้ในการพัฒนาตนเอง",

  "MSF - Research & Innovation (R)":
    "R — วิจัยและนวัตกรรม: ความรู้ทางวิจัยและการนำความรู้จากงานวิจัยไปประยุกต์ในทางปฏิบัติอย่างเหมาะสม",

  "MSF - Resilience (R)":
    "R — Resilience: ความสามารถในการรับมือกับปัญหาและอุปสรรค และการฟื้นตัวหลังเผชิญความกดดัน",

  "MSF - Altruism (A)":
    "A — Altruism: ยึดผู้ป่วยและประโยชน์ส่วนรวมเป็นที่ตั้งในการดูแลและตัดสินใจ",

  "MSF - Mastery (M)":
    "M — Mastery: ทักษะซักประวัติ ตรวจร่างกาย หัตถการ การคิดวิเคราะห์และแก้ปัญหาทางคลินิก",

  "MSF - Digital Literacy (D)":
    "D — Digital Literacy: การบันทึก EMR การใช้เทคโนโลยีสารสนเทศอย่างเหมาะสม และความระมัดระวังต่อความปลอดภัยของข้อมูลผู้ป่วย",

  "MSF - Professionalism (P)":
    "P — Professionalism: ตรงต่อเวลา กิริยามารยาท การแต่งกาย ความซื่อสัตย์และความรับผิดชอบ",

  "MSF - Humility & Volunteerism (H)":
    "H — Humility and Volunteerism: มนุษยสัมพันธ์ การทำงานร่วมทีม ความอ่อนน้อมถ่อมตน จิตอาสา และการให้เกียรติผู้ป่วยและเพื่อนร่วมงาน",
};
