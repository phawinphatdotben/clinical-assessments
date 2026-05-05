"use client";

import type { DepartmentWpbaStack, WpbaPortfolioFormKey } from "../lib/assessment-filters";
import { t, useUiLanguage } from "../lib/ui-language";

const WPBA_PORTFOLIO_FORM_ORDER = ["MiniCEX", "CbD", "DOPS"] as const satisfies readonly WpbaPortfolioFormKey[];

const SEGMENT_CLASS: Record<WpbaPortfolioFormKey, string> = {
  MiniCEX: "bg-sky-600",
  CbD: "bg-emerald-600",
  DOPS: "bg-violet-600",
};

type DepartmentPortfolioChartProps = {
  data: DepartmentWpbaStack[];
  title?: string;
  emptyMessage?: string;
};

export function DepartmentPortfolioChart({
  data,
  title = "Workplace-based assessments by department",
  emptyMessage = "No completed assessments to chart yet.",
}: DepartmentPortfolioChartProps) {
  const { language } = useUiLanguage();
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">{emptyMessage}</div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {language === "th" && title === "Workplace-based assessments by department"
          ? "จำนวนการประเมินตามแผนก"
          : title}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {t(
          language,
          "Only MiniCEX, CbD (Case-Based Discussion), and DOPS are counted. Bar segments show the mix per Department/Rotation; bar length scales to the department with the highest total.",
          "นับเฉพาะ MiniCEX, CbD และ DOPS เท่านั้น แต่ละสีในกราฟแท่งแสดงสัดส่วนของแต่ละแบบประเมินในแผนก/โรเตชัน และความยาวแท่งเทียบกับแผนกที่มีจำนวนรวมสูงสุด"
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
        {WPBA_PORTFOLIO_FORM_ORDER.map((key) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${SEGMENT_CLASS[key]}`} aria-hidden />
            {key === "CbD" ? "CbD" : key}
          </span>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {data.map(({ department, total, ...counts }) => (
          <div key={department}>
            <div className="mb-1 flex justify-between text-xs text-slate-600">
              <span className="max-w-[70%] truncate font-medium text-slate-800" title={department}>
                {department}
              </span>
              <span className="tabular-nums text-slate-700">{total}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="flex h-full min-w-[4px] overflow-hidden rounded-full transition-[width]"
                style={{ width: `${Math.max(4, (total / maxTotal) * 100)}%` }}
              >
                {WPBA_PORTFOLIO_FORM_ORDER.map((key) => {
                  const n = counts[key];
                  if (n <= 0) {
                    return null;
                  }
                  const pct = (n / total) * 100;
                  return (
                    <div
                      key={key}
                      className={`h-full min-w-px ${SEGMENT_CLASS[key]}`}
                      style={{ width: `${pct}%` }}
                      title={`${key}: ${n}`}
                    />
                  );
                })}
              </div>
            </div>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
              {WPBA_PORTFOLIO_FORM_ORDER.map((key) => {
                const n = counts[key];
                if (n <= 0) {
                  return null;
                }
                return (
                  <span key={key}>
                    {key === "CbD" ? "CbD" : key}: {n}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
