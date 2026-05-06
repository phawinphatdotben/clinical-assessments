"use client";

import Link from "next/link";
import {
  CLINICAL_DEPARTMENTS,
  YEAR7_CLINICAL_FORMS_DRIVE_URL,
  getFormOffersForDepartment,
  type DepartmentFormOffer,
} from "../lib/department-form-catalog";
import { useFormSelection } from "../lib/use-form-selection";
import { t, useUiLanguage } from "../lib/ui-language";
import { WPBA_FORM_CONFIGS, type WpbaFormSlug } from "../../components/forms/wpba-config";

type Role = "staff" | "student" | "admin";

type CreateAssessmentLinksProps = {
  role: Role;
  className?: string;
  /** When set, only these WPBA slugs are shown (OR logic with empty = show none). */
  allowedSlugs?: WpbaFormSlug[] | null;
};

const THAI_FORM_TITLE_BY_SLUG: Record<WpbaFormSlug, string> = {
  dops: "การประเมินหัตถการโดยตรง (DOPS)",
  extern: "แบบประเมินคลินิก Extern",
  jc: "วารสารสโมสร (Journal Conference)",
  msf: "ประเมินรอบด้าน (MSF)",
  cbd: "อภิปรายผู้ป่วยรายกรณี (CbD)",
  minicex: "การประเมิน MiniCEX",
  "health-ed-im": "สุขศึกษา (อายุรกรรม)",
  "case-presentation": "การนำเสนอเคส",
  "interesting-case": "การนำเสนอเคสที่น่าสนใจ",
  "opd-assessment": "แบบประเมิน OPD (กุมารเวช)",
  "opd-clinical": "แบบประเมิน OPD ทางคลินิก",
  "ipd-clinical": "แบบประเมิน IPD ทางคลินิก",
  "interesting-case-general": "การนำเสนอเคสที่น่าสนใจ (ทั่วไป)",
  "anticipatory-guidance": "แบบประเมิน Anticipatory Guidance",
  "or-assessment": "แบบประเมินห้องผ่าตัด (OR)",
  "health-ed-obgyn": "สุขศึกษา (สูติ-นรีเวช)",
};

const THAI_DEPARTMENT_LABEL_BY_KEY: Record<string, string> = {
  "Internal Medicine": "อายุรศาสตร์ (Internal Medicine)",
  Pediatrics: "กุมารเวชศาสตร์ (Pediatrics)",
  "Sx/Ortho/ER": "ศัลยกรรม / ออร์โธ / ฉุกเฉิน",
  "OB/GYN": "สูติศาสตร์-นรีเวชวิทยา (OB/GYN)",
  "ComMed/FamMed": "เวชศาสตร์ชุมชน / เวชศาสตร์ครอบครัว",
};

const THAI_OFFER_LABEL_BY_ID: Record<string, string> = {
  "im-minicex": "MiniCEX",
  "im-cbd": "อภิปรายผู้ป่วยรายกรณี (CbD)",
  "im-health-ed": "สุขศึกษา (อายุรกรรม)",
  "im-dops": "DOPS",
  "im-ipd": "แบบประเมิน IPD ทางคลินิก",
  "im-jc": "Journal Conference",
  "im-case-presentation": "การนำเสนอเคส",
  "im-interesting-case-general": "การนำเสนอเคสที่น่าสนใจ",
  "im-opd-clinical": "แบบประเมิน OPD ทางคลินิก",
  "ped-dops": "DOPS",
  "ped-cbd": "อภิปรายผู้ป่วยรายกรณี (CbD)",
  "ped-minicex": "MiniCEX",
  "ped-jc": "Journal Conference",
  "ped-case-presentation": "การนำเสนอเคส",
  "ped-interesting-case-general": "การนำเสนอเคสที่น่าสนใจ",
  "ped-opd-assessment": "แบบประเมิน OPD (กุมารเวช)",
  "ped-anticipatory-guidance": "แบบประเมิน Anticipatory Guidance",
  "ob-health-ed": "สุขศึกษา (สูติ-นรีเวช)",
  "ob-dops": "DOPS สูติศาสตร์",
  "ob-msf": "MSF",
  "ob-cbd": "CbD",
  "ob-minicex": "MiniCEX",
  "ob-or-assessment": "แบบประเมิน OR",
  "ob-interesting-case-general": "การนำเสนอเคสที่น่าสนใจ",
  "ob-opd-clinical": "แบบประเมิน OPD ทางคลินิก",
  "ob-ipd-clinical": "แบบประเมิน IPD ทางคลินิก",
  "sx-or": "แบบประเมิน OR",
  "sx-dops": "การประเมินหัตถการโดยตรง (DOPS)",
  "sx-topic": "การนำเสนอหัวข้อ",
  "sx-minicex": "MiniCEX",
  "sx-cbd": "CbD",
  "sx-jc": "Journal Conference",
  "sx-case-presentation": "การนำเสนอเคส",
  "sx-interesting-case-general": "การนำเสนอเคสที่น่าสนใจ",
  "sx-opd-clinical": "แบบประเมิน OPD ทางคลินิก",
  "sx-ipd-clinical": "แบบประเมิน IPD ทางคลินิก",
  "cm-home": "เยี่ยมบ้าน (NCD / Palliative)",
  "cm-opd": "แบบบันทึก OPD",
  "cm-msf": "MSF",
  "cm-oral": "การนำเสนอด้วยวาจา",
  "cm-minicex": "MiniCEX",
  "cm-case-presentation": "การนำเสนอเคส",
  "cm-interesting-case-general": "การนำเสนอเคสที่น่าสนใจ",
  "cm-opd-clinical": "แบบประเมิน OPD ทางคลินิก",
  "cm-ipd-clinical": "แบบประเมิน IPD ทางคลินิก",
};

const THAI_OFFER_DETAIL_BY_ID: Record<string, string> = {
  "im-health-ed": "แบบฟอร์มสุขศึกษาอิเล็กทรอนิกส์ตามเกณฑ์ CHMD 7403",
  "im-dops": "ตัวอย่างหัตถการ: thoracocentesis, lumbar puncture, IV access, ETT, abdominal paracentesis",
  "im-ipd": "แบบประเมิน IPD ทางคลินิกในระบบ (ไม่ใช่กุมารเวช)",
  "im-opd-clinical": "แบบประเมิน OPD ทางคลินิกในระบบ (ไม่ใช่กุมารเวช)",
  "ped-dops": "หัตถการกุมารเวช — เลือกชื่อหัตถการในแบบฟอร์ม",
  "ob-health-ed": "เทมเพลตทั่วไปพร้อม rubric ตามหัวข้อ (ให้นมบุตร, คุมกำเนิด, หลังคลอด, หลังผ่าตัด TAH c BSO)",
  "ob-dops":
    "หัตถการสูติ-นรีเวช — PAP smear, vaginal packing, IUD insertion, contraceptive implant removal",
  "sx-or": "แบบประเมิน OR เฉพาะทางตาม rubric ห้องผ่าตัด",
  "sx-dops":
    "หัตถการศัลย/ออร์โธ/ฉุกเฉิน — FAST บาดเจ็บรุนแรง, excision, digital nerve block, short arm slab, skin traction",
  "sx-topic": "การนำเสนอหัวข้อ — ใช้ฟอร์ม Journal Conference ตามนโยบาย",
  "cm-opd": "แบบประเมินผู้ป่วยนอก — บันทึกในรูปแบบ MiniCEX",
};

function getLocalizedFormTitle(language: "en" | "th", slug: WpbaFormSlug, fallback: string): string {
  if (language === "th") {
    return THAI_FORM_TITLE_BY_SLUG[slug] ?? fallback;
  }
  return fallback;
}

/** Flat list of in-app WPBA links (used when you already know allowed slugs). */
export function CreateAssessmentLinks({ role, className, allowedSlugs }: CreateAssessmentLinksProps) {
  const { language } = useUiLanguage();
  const base = role === "staff" ? "/staff/forms" : "/student/forms";
  const slugSet =
    allowedSlugs != null && allowedSlugs.length > 0 ? new Set(allowedSlugs) : null;
  const configs = slugSet
    ? WPBA_FORM_CONFIGS.filter((c) => slugSet.has(c.slug))
    : WPBA_FORM_CONFIGS;
  return (
    <div className={className ?? "flex flex-wrap gap-2"}>
      {configs.map((formConfig) => (
        <Link
          key={formConfig.slug}
          href={`${base}/${formConfig.slug}`}
          className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {t(language, "Create", "สร้าง")}{" "}
          {getLocalizedFormTitle(language, formConfig.slug, formConfig.title)}
        </Link>
      ))}
    </div>
  );
}

function FormOfferGrid({ role, offers }: { role: Role; offers: DepartmentFormOffer[] }) {
  const { language } = useUiLanguage();
  const base = role === "staff" ? "/staff/forms" : role === "student" ? "/student/forms" : null;

  if (offers.length === 0) {
    return (
      <p className="mt-3 text-sm text-slate-600">
        {t(language, "No forms are configured for this rotation in the catalog. Check", "ยังไม่มีฟอร์มสำหรับแผนกนี้ กรุณาตรวจสอบ")}{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">department-form-catalog.ts</code>.
      </p>
    );
  }

  return (
    <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => {
        const rubricHref =
          offer.hideRubricLink ? null : (offer.rubricDriveUrl ?? YEAR7_CLINICAL_FORMS_DRIVE_URL);
        const formTitleBase = WPBA_FORM_CONFIGS.find((c) => c.slug === offer.wpbaSlug)?.title ?? offer.wpbaSlug;
        const formTitle = getLocalizedFormTitle(language, offer.wpbaSlug, formTitleBase);
        const localizedOfferLabel =
          language === "th" ? (THAI_OFFER_LABEL_BY_ID[offer.id] ?? formTitle) : offer.label;
        const localizedOfferDetail =
          language === "th" ? (THAI_OFFER_DETAIL_BY_ID[offer.id] ?? offer.detail) : offer.detail;

        return (
          <li key={offer.id}>
            <div className="flex h-full min-h-[6rem] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-sm font-semibold text-slate-900">{localizedOfferLabel}</span>
              {localizedOfferDetail ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{localizedOfferDetail}</p>
              ) : null}
              <div className="mt-3 mt-auto flex flex-col gap-2">
                {base ? (
                  <Link
                    href={`${base}/${offer.wpbaSlug}`}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    {t(language, "Start in app", "เริ่มทำในระบบ")} — {formTitle}
                  </Link>
                ) : (
                  <span className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-700">
                    {t(language, "Admin view", "มุมมองแอดมิน")} — {formTitle}
                  </span>
                )}
                {rubricHref ? (
                  <a
                    href={rubricHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-xs font-medium text-slate-600 underline underline-offset-2 transition hover:text-slate-900"
                  >
                    {t(language, "View printable rubric / reference in Drive", "ดูเกณฑ์ประเมิน (Rubric) / ไฟล์อ้างอิงใน Drive")} →
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DepartmentPickCard({
  selectedDepartment,
  onDepartmentChange,
}: {
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
}) {
  const { language } = useUiLanguage();
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-800">{t(language, "Step 1 — Department / rotation", "ขั้นตอนที่ 1 — แผนก / โรเตชัน")}</span>
        <select
          value={selectedDepartment}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
        >
          <option value="">{t(language, "Select department…", "เลือกแผนก…")}</option>
          {CLINICAL_DEPARTMENTS.map((d) => (
            <option key={d.rotationKey} value={d.rotationKey}>
              {language === "th" ? (THAI_DEPARTMENT_LABEL_BY_KEY[d.rotationKey] ?? d.label) : d.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs text-slate-600">
        Everything below submits in this app ({""}
        <code className="rounded bg-white px-1 py-0.5 ring-1 ring-slate-200">DEPARTMENT_FORM_OFFERS</code> {""}
        maps labels to WPBA routes). Optionally open Drive for printable rubrics. Edit mapping in {""}
        <code className="rounded bg-white px-1 py-0.5 ring-1 ring-slate-200">department-form-catalog.ts</code>; add
        precise <code className="rounded bg-white px-1 py-0.5 ring-1 ring-slate-200">rubricDriveUrl</code> per row when
        you have direct file links. Default folder:{""}
        <a
          href={YEAR7_CLINICAL_FORMS_DRIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-medium text-slate-800 underline underline-offset-2 hover:text-slate-600"
        >
          Year 7 Drive root
        </a>
      </p>
    </div>
  );
}

/** Full-width Create assessment tab: hierarchical department → filtered offers. */
export function CreateAssessmentTabPanel({ role }: { role: Role }) {
  const { language } = useUiLanguage();
  const { selectedDepartment, setSelectedDepartment, formOffers, hasDepartmentSelected } = useFormSelection();

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-slate-900">{t(language, "Create assessment", "สร้างแบบประเมิน")}</h2>
      <p className="mt-1 text-sm text-slate-600">
        Assessments are completed in this app. Use Drive only when you need the original rubric PDF/DOC alongside the same
        activity.
      </p>
      <DepartmentPickCard selectedDepartment={selectedDepartment} onDepartmentChange={setSelectedDepartment} />
      {!hasDepartmentSelected ? (
        <p className="mt-4 text-sm text-slate-600">{t(language, "Select a department to see which evaluations apply.", "เลือกแผนกเพื่อดูแบบประเมินที่ใช้ได้")}</p>
      ) : (
        <>
          <h3 className="mt-8 text-base font-semibold text-slate-900">{t(language, "Step 2 — Evaluation for this rotation", "ขั้นตอนที่ 2 — แบบประเมินสำหรับโรเตชันนี้")}</h3>
          <p className="mt-1 text-sm text-slate-600">
            Primary action starts the electronic form here. Secondary link opens Drive for reference rubrics only (this
            app does not integrate the Google Drive API).
          </p>
          <FormOfferGrid role={role} offers={formOffers} />
        </>
      )}
    </div>
  );
}

/** Bottom dashboard: compact department picker + same filtered grid when selected. */
export function CreateAssessmentDashboardFoot({ role }: { role: Role }) {
  const { language } = useUiLanguage();
  const { selectedDepartment, setSelectedDepartment, formOffers, hasDepartmentSelected } = useFormSelection();

  if (role === "admin") {
    return (
      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold text-slate-900">{t(language, "Form catalog (all departments)", "รายการฟอร์มทั้งหมด (ทุกแผนก)")}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Admin view of every configured in-app form. Grouped by department/rotation.
        </p>
        <div className="mt-4 space-y-8">
          {CLINICAL_DEPARTMENTS.map((department) => {
            const offers = getFormOffersForDepartment(department.rotationKey);
            return (
              <section key={department.rotationKey}>
                <h3 className="text-sm font-semibold text-slate-900">
                  {language === "th"
                    ? (THAI_DEPARTMENT_LABEL_BY_KEY[department.rotationKey] ?? department.label)
                    : department.label}
                </h3>
                <FormOfferGrid role="admin" offers={offers} />
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="text-lg font-semibold text-slate-900">{t(language, "Create assessment", "สร้างแบบประเมิน")}</h2>
      <p className="mt-1 text-sm text-slate-600">
        Same flow as the <strong>Create assessment</strong> tab — in-app submissions; Drive shortcut is optional rubric
        reference.
      </p>
      <div className="mt-3 max-w-xl">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">{t(language, "Department / rotation", "แผนก / โรเตชัน")}</span>
          <select
            value={selectedDepartment}
            onChange={(event) => setSelectedDepartment(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            <option value="">{t(language, "Select department…", "เลือกแผนก…")}</option>
            {CLINICAL_DEPARTMENTS.map((d) => (
              <option key={d.rotationKey} value={d.rotationKey}>
                {language === "th" ? (THAI_DEPARTMENT_LABEL_BY_KEY[d.rotationKey] ?? d.label) : d.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {hasDepartmentSelected ? (
        <div className="mt-4">
          <FormOfferGrid role={role} offers={formOffers} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{t(language, "Pick a department to show available evaluations.", "เลือกแผนกเพื่อแสดงแบบประเมินที่ใช้ได้")}</p>
      )}
    </div>
  );
}
