/**
 * Internal Medicine — Health education evaluation (CHMD 7403 / PDF rubric).
 * Tiers 1–4: Need improvement → Borderline → Good → Excellent (except professionalism = checklist count bands).
 */
export const IM_HEALTH_ED_FORM_TYPE = "Internal Medicine Health Education" as const;

export const IM_HEALTH_ED_SIMPLE_TIERS = [1, 2, 3, 4] as const;

export const IM_HEALTH_ED_TIER_LABELS = [
  "Need improvement (1)",
  "Borderline (2)",
  "Good (3)",
  "Excellent (4)",
] as const;

/** Professionalism: how many of 6 etiquette items were demonstrated. */
export const IM_HEALTH_ED_PROFESSIONALISM_TIER_LABELS = [
  "Need improvement — 0–1 items",
  "Borderline — 2–3 items",
  "Good — 4–5 items",
  "Excellent — all 6 items",
] as const;

const PRO_KEY = "IM Health Ed - Professionalism checklist";

export function isImHealthEdProfessionalismKey(criteriaKey: string): boolean {
  return criteriaKey === PRO_KEY;
}

export function getImHealthEdScoreTiers(): readonly [number, number, number, number] {
  return [1, 2, 3, 4];
}

export function getImHealthEdTierLabels(criteriaKey: string): readonly string[] {
  return isImHealthEdProfessionalismKey(criteriaKey)
    ? IM_HEALTH_ED_PROFESSIONALISM_TIER_LABELS
    : IM_HEALTH_ED_TIER_LABELS;
}

/** "IM Health Ed - Assess baseline" → column for Supabase. */
export function getImHealthEdScoreColumnName(criteriaKey: string): string {
  if (!criteriaKey.startsWith("IM Health Ed - ")) {
    return `${criteriaKey} SCORE`;
  }
  const rest = criteriaKey.slice("IM Health Ed - ".length);
  return `IM Health Ed-${rest} SCORE`;
}

/** Per-criterion anchors from official form (Thai); shown under each row. */
export const IM_HEALTH_ED_CRITERION_RUBRIC_THAI: Record<string, string> = {
  "IM Health Ed - Assess baseline":
    "(Assess baseline) ไม่ประเมินความรู้เดิม / มีการถามแต่นำไปใช้ไม่ดี / ประเมินได้ดีและตั้งต้นสนทนาได้ / ประเมินลึกถึงบริบทและจับประเด็นที่ผู้ป่วยต้องการรู้ได้แม่นยำ",
  "IM Health Ed - Information delivery":
    "(Information delivery) ข้อมูลไม่ถูกต้องหรือศัพท์แพทย์เกินไป / ถูกต้องแต่อธิบายวกหรือไม่มีตัวอย่าง / ถูกต้อง ภาษาเข้าใจง่าย มีตัวอย่างหรือสื่อ / เรื่องซับซ้อนอธิบายเข้าใจง่าย ลำดับเป็นระบบ ใช้สื่อชี้ผลตรวจประกอบได้ถูกต้อง",
  "IM Health Ed - Teach-back and engagement":
    "(Teach-back) ปิดการสนทนาไม่ให้ซักถาม / เปิดโอกาสแต่ไม่ teach-back / มี teach-back ให้ทบทวนและตอบข้อซักถาม / teach-back เป็นธรรมชาติ แก้ความเข้าใจผิดได้นุ่มนวล",
  "IM Health Ed - Empowerment and shared planning":
    "(Empowerment & shared planning) สั่งตามฝ่ายเดียว / แนะนำแต่แผนทำจริงยาก / วางแผนเหมาะสมกับบริบทและให้กำลังใจ / สร้างแรงจูงใจเชิงบวก ตกลงแผนร่วมที่ทำได้จริง",
  "IM Health Ed - Communication skills (patient)":
    "(Communication) สื่อสารไม่ได้หรือกิริยาไม่เหมาะสม / สื่อประเด็นสำคัญบางส่วนหรือศัพท์แพทย์เยอะ / สื่อประเด็นสำคัญได้ กิริยาท่าทางเหมาะสม / สื่อได้ดีเยี่ยม และกิริยาท่าทางเหมาะสม",
  "IM Health Ed - Professionalism checklist":
    "รายการ 6 ข้อ: ตรงเวลา / แนะนำตัวและ patient identification / ขออนุญาตถึงจุดประสงค์ / แสดงความเห็นอกเห็นใจ / แต่งกายเรียบร้อย / จบการสนทนาอย่างเหมาะสม — เลือกคอลัมน์ตามจำนวนข้อที่ครบ",
};
