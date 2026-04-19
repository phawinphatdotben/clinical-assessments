/**
 * Journal Conference (Evidence-Based Medicine / Journal Club) — scores from TM200824 form.
 * Tiers: Needs Improvement → Acceptable → Good → Excellent
 */
export const JC_SCORE_TIERS_BY_CRITERION: Record<
  string,
  readonly [number, number, number, number]
> = {
  "JC - 1.1 Rationale/Importance": [1, 2, 4, 5],
  "JC - 1.2 Methodology Overview": [1, 2, 4, 5],
  "JC - 1.3 Results Overview": [1, 2, 4, 5],
  "JC - 1.4 Discussion & Conclusion": [1, 2, 4, 5],
  "JC - 2.1 Strengths & Limitations": [2.5, 5, 7.5, 10],
  "JC - 2.2 Clinical Application": [2.5, 5, 7.5, 10],
  "JC - 2.3 Further Studies Needed": [2.5, 5, 7.5, 10],
  "JC - 2.4 Review & Summary": [2.5, 5, 7.5, 10],
  "JC - 3.1 Preparation & Materials": [1, 2, 4, 5],
  "JC - 3.2 Presentation Skills": [2.5, 5, 7.5, 10],
  "JC - 3.3 Time Management": [1, 2, 4, 5],
  "JC - 4.0 Ability to Answer Questions": [5, 10, 15, 20],
};

export const JC_TIER_LABELS = [
  "Needs Improvement",
  "Acceptable",
  "Good",
  "Excellent",
] as const;

/** Supabase column e.g. "JC - 1.1 ..." → "JC-1.1 ... SCORE" */
export function getJournalClubScoreColumnName(criteriaKey: string): string {
  if (criteriaKey.startsWith("JC - ")) {
    const rest = criteriaKey.slice("JC - ".length);
    return `JC-${rest} SCORE`;
  }
  return `${criteriaKey} SCORE`;
}

export function getJournalClubScoreTiers(criteriaKey: string): readonly [
  number,
  number,
  number,
  number,
] {
  const tiers = JC_SCORE_TIERS_BY_CRITERION[criteriaKey];
  if (tiers) {
    return tiers;
  }
  return [0, 0, 0, 0];
}

/** เกณฑ์ระดับคะแนนทั่วไป (จากแบบฟอร์ม) — ใช้ประกอบทุกหัวข้อ */
export const JC_GENERIC_SCALE_RUBRIC_THAI: readonly {
  title: string;
  lines: readonly string[];
}[] = [
  {
    title: "Needs Improvement (ต้องปรับปรุง)",
    lines: [
      "ต้องแนะนำและอธิบายเพิ่มเติมเป็นอย่างมาก",
      "ผู้สอนต้องช่วยอธิบายความถูกต้องของข้อมูล",
      "มีความเข้าใจในเนื้อหาน้อย",
      "ไม่สามารถถ่ายทอดความรู้ให้ผู้อื่นเข้าใจได้",
    ],
  },
  {
    title: "Acceptable (ยอมรับได้)",
    lines: [
      "ต้องแนะนำและอธิบายเพิ่มเติมในบางช่วง",
      "สามารถเข้าใจเนื้อหาหลักได้ดีตามมาตรฐาน",
      "สามารถถ่ายทอดความรู้ให้ผู้อื่นเข้าใจได้",
    ],
  },
  {
    title: "Good (ดี)",
    lines: [
      "ต้องแนะนำและอธิบายเพิ่มเติมเล็กน้อย",
      "เข้าใจในเนื้อหาได้ดี",
      "สามารถถ่ายทอดความรู้ให้ผู้อื่นและเรียบเรียงข้อมูลได้ดี",
    ],
  },
  {
    title: "Excellent (ดีเยี่ยม)",
    lines: [
      "ไม่จำเป็นต้องแนะนำเพิ่มเติม",
      "สามารถนำข้อมูลมาอภิปรายโดยละเอียดได้ และมีความเข้าใจอย่างลึกซึ้ง",
      "สามารถบรรลุวัตถุประสงค์ได้อย่างดีเยี่ยม",
      "ถ่ายทอดความรู้ให้ผู้อื่นและเรียบเรียงข้อมูลได้ดีเยี่ยม",
    ],
  },
];

/** คำอธิบายเชิงเนื้อหาแต่ละหัวข้อ (สรุปจากตารางในแบบฟอร์ม) */
export const JC_CRITERION_RUBRIC_THAI: Record<string, string> = {
  "JC - 1.1 Rationale/Importance":
    "ภาพรวมงานวิจัย — ที่มาและความสำคัญ: อธิบายที่มาและความสำคัญของการศึกษาได้ชัดเจน ระบุความสำคัญ/เป้าหมาย และคำถามหรือจุดประสงค์ของการศึกษา",

  "JC - 1.2 Methodology Overview":
    "ภาพรวมวิธีการศึกษา: ครอบคลุมดีไซน์การศึกษา (เช่น RCT, cohort, case-control), การสรรหาผู้ป่วย/เกณฑ์เข้า-ออก, การแบ่งกลุ่ม, intervention/exposure และตัวเปรียบเทียบ, ผลลัพธ์ปฐมภูมิ-ทุติยภูมิ, การวิเคราะห์เชิงสถิติและการจัดการข้อมูลที่ขาดหาย ฯลฯ",

  "JC - 1.3 Results Overview":
    "ภาพรวมผลลัพธ์การศึกษา: สรุปผลในแต่ละกลุ่ม รวมถึงค่าความเชื่อมั่น พี-แวลลู่ และข้อมูลประกอบที่จำเป็น",

  "JC - 1.4 Discussion & Conclusion":
    "การอภิปรายและผลสรุปการศึกษา: สรุปการอภิปรายและข้อสรุปของผู้เขียนได้ถูกต้องและครบถ้วน",

  "JC - 2.1 Strengths & Limitations":
    "การประเมินงานวิจัย: ระบุจุดแข็ง ข้อจำกัด และผลสรุปของผู้เขียนได้ — และสามารถให้มุมมองจุดแข็ง ข้อจำกัด และสรุปในแบบของตนเองได้",

  "JC - 2.2 Clinical Application":
    "การนำไปใช้ในทางปฏิบัติ: อธิบายผลกระทบและการประยุกต์ใช้กับการปฏิบัติทางคลินิกในปัจจุบันได้ชัดเจน",

  "JC - 2.3 Further Studies Needed":
    "ระบุการศึกษาเพิ่มเติมที่จำเป็นในอนาคตได้เหมาะสม",

  "JC - 2.4 Review & Summary":
    "ทบทวนความสำคัญของการวิจัย วิธีการศึกษา และผลลัพธ์ได้ครบถ้วน",

  "JC - 3.1 Preparation & Materials":
    "ความพร้อมและการเตรียมการ: เอกสาร/PowerPoint ถูกต้อง กระชับ เป็นระเบียบตามหลักไวยากรณ์ ถ่ายทอดเป็นเหตุเป็นผล และมีความเป็นมืออาชีพ",

  "JC - 3.2 Presentation Skills":
    "การสื่อสารและการนำเสนอ: ภาพลักษณ์เหมาะสมและเป็นมืออาชีพ มั่นใจ การสบตาและจังหวะการพูด เส้นเรื่องต่อเนื่อง",

  "JC - 3.3 Time Management":
    "การบริหารเวลา: ใช้เวลาเหมาะสม กระชับ และสอดคล้องกับเวลาที่กำหนด",

  "JC - 4.0 Ability to Answer Questions":
    "ความสามารถในการตอบคำถาม: ตอบได้มีเหตุผลและถูกต้อง คิดภายใต้แรงกดดันได้ และเมื่อไม่มั่นใจสามารถระบุจุดที่ไม่มั่นใจได้อย่างชัดเจน",
};
