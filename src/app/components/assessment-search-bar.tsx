"use client";

import { useUiLanguage } from "../lib/ui-language";

type AssessmentSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
};

export function AssessmentSearchBar({
  value,
  onChange,
  id = "assessment-person-search",
  label = "Filter by person",
  placeholder = "Name, Student ID, Staff ID, or email (leave empty to show most recent first)",
  helperText = "Matches people linked to assessments (evaluator, student, staff). Empty search lists everything with the newest activity first.",
}: AssessmentSearchBarProps) {
  const { language } = useUiLanguage();
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {language === "th" && label === "Filter by person" ? "ค้นหาตามบุคคล" : label}
      </label>
      <input
        id={id}
        type="search"
        autoComplete="off"
        placeholder={
          language === "th" &&
          placeholder === "Name, Student ID, Staff ID, or email (leave empty to show most recent first)"
            ? "ชื่อ, รหัสนักศึกษา, รหัสอาจารย์, หรืออีเมล (เว้นว่างเพื่อแสดงล่าสุดก่อน)"
            : placeholder
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      />
      <p className="mt-1 text-xs text-slate-500">
        {language === "th" &&
        helperText ===
          "Matches people linked to assessments (evaluator, student, staff). Empty search lists everything with the newest activity first."
          ? "ค้นหาจากบุคคลที่เกี่ยวข้องกับแบบประเมิน (ผู้ประเมิน นักศึกษา อาจารย์) เว้นว่างเพื่อแสดงทั้งหมดโดยเรียงรายการล่าสุดก่อน"
          : helperText}
      </p>
    </div>
  );
}
