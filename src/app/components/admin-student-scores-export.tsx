"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  buildCsvContent,
  formatAssessmentScoreWithFull,
  buildLongFormatExportRows,
  buildPrunedSummaryRows,
  buildPrunedWideExport,
  filterAssessmentsByExactStudentId,
  formatAssessmentRowDateDisplay,
  sanitizeExportFilenamePart,
} from "../lib/admin-assessment-export";
import { pickStoredOrComputedScoreSum } from "../lib/assessment-score-summation";
import { pickAssessmentRowId, STUDENT_SELF_REFLECTION_COLUMN } from "../lib/student-feedback";
import { t, useUiLanguage } from "../lib/ui-language";

type AssessmentRow = Record<string, unknown>;
const NOW_MS = Date.now();

const LONG_CSV_COLUMNS = [
  "Assessment ID",
  "Student ID",
  "Form Type",
  "Status",
  "Recorded date",
  "Field name",
  "Value",
] as const;

const pickString = (row: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
    if (typeof v === "number") {
      return String(v);
    }
  }
  return "";
};

function snippet(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max)}…`;
}

function parseRowDateMs(row: Record<string, unknown>): number | null {
  const raw = row.updated_at ?? row.created_at;
  if (raw == null || raw === "") {
    return null;
  }
  const d = new Date(String(raw));
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

type AdminStudentScoresExportProps = {
  assessmentRows: AssessmentRow[];
  assessmentLoading: boolean;
  assessmentError: string | null;
};

export function AdminStudentScoresExport({
  assessmentRows,
  assessmentLoading,
  assessmentError,
}: AdminStudentScoresExportProps) {
  const { language } = useUiLanguage();
  const [studentIdInput, setStudentIdInput] = useState("");
  const [appliedId, setAppliedId] = useState("");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const matchedRows = useMemo(() => {
    if (!appliedId.trim()) {
      return [];
    }
    return filterAssessmentsByExactStudentId(
      assessmentRows as Record<string, unknown>[],
      appliedId
    ) as AssessmentRow[];
  }, [assessmentRows, appliedId]);

  const applyFilter = () => {
    setAppliedId(studentIdInput.trim());
  };

  const stamp = () => new Date().toISOString().slice(0, 10);

  const downloadBlob = (filename: string, blob: Blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /** One row per filled field — easiest to read; no empty grid cells. */
  const runExportCsvByField = () => {
    if (matchedRows.length === 0) {
      return;
    }
    const longRows = buildLongFormatExportRows(matchedRows as Record<string, unknown>[]);
    const csv = buildCsvContent([...LONG_CSV_COLUMNS], longRows);
    const safe = sanitizeExportFilenamePart(appliedId);
    downloadBlob(`student-${safe}-by-field-${stamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
  };

  /** Traditional wide table; columns that are empty for every row are removed. */
  const runExportCsvWide = () => {
    if (matchedRows.length === 0) {
      return;
    }
    const { columns, rowsOut } = buildPrunedWideExport(matchedRows as Record<string, unknown>[]);
    if (columns.length === 0) {
      return;
    }
    const csv = buildCsvContent(columns, rowsOut);
    const safe = sanitizeExportFilenamePart(appliedId);
    downloadBlob(`student-${safe}-wide-${stamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
  };

  /** Summary sheet + one row per field sheet (still no null grid). */
  const runExportExcel = () => {
    if (matchedRows.length === 0) {
      return;
    }
    const raw = matchedRows as Record<string, unknown>[];
    const wb = XLSX.utils.book_new();

    const { columns: sumCols, rowsOut: sumRows } = buildPrunedSummaryRows(raw);
    if (sumCols.length > 0 && sumRows.length > 0) {
      const wsSummary = XLSX.utils.json_to_sheet(sumRows);
      wsSummary["!cols"] = sumCols.map(() => ({ wch: 32 }));
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    }

    const longRows = buildLongFormatExportRows(raw);
    if (longRows.length > 0) {
      const wsLong = XLSX.utils.json_to_sheet(longRows);
      wsLong["!cols"] = [...LONG_CSV_COLUMNS].map(() => ({ wch: 36 }));
      XLSX.utils.book_append_sheet(wb, wsLong, "Scores & feedback by field");
    }

    const safe = sanitizeExportFilenamePart(appliedId);
    XLSX.writeFile(wb, `student-${safe}-export-${stamp()}.xlsx`);
  };

  const canExport = matchedRows.length > 0 && !assessmentLoading && !assessmentError;
  const totalsByFormType = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of matchedRows) {
      const formType = pickString(row, ["Form Type", "form_type"]) || "Unknown";
      const score = Number(pickStoredOrComputedScoreSum(row));
      if (Number.isNaN(score)) {
        continue;
      }
      map.set(formType, (map.get(formType) ?? 0) + score);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [matchedRows]);
  const grandTotalScore = useMemo(
    () => totalsByFormType.reduce((acc, [, score]) => acc + score, 0),
    [totalsByFormType]
  );
  const recentActivity = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const within7 = NOW_MS - 7 * dayMs;
    const within30 = NOW_MS - 30 * dayMs;

    let count7 = 0;
    let count30 = 0;

    const latestRows = [...matchedRows]
      .map((row) => ({ row, ms: parseRowDateMs(row) }))
      .sort((a, b) => (b.ms ?? -1) - (a.ms ?? -1))
      .slice(0, 5);

    for (const row of matchedRows) {
      const ms = parseRowDateMs(row);
      if (ms == null) {
        continue;
      }
      if (ms >= within7) {
        count7 += 1;
      }
      if (ms >= within30) {
        count30 += 1;
      }
    }

    return { count7, count30, latestRows };
  }, [matchedRows]);

  const handleCopyScoreSummary = async () => {
    if (!appliedId || totalsByFormType.length === 0) {
      return;
    }
    const lines = [
      `${t(language, "Student ID", "รหัสนักศึกษา")}: ${appliedId}`,
      `${t(language, "Grand total score", "คะแนนรวมทั้งหมด")}: ${grandTotalScore}`,
      `${t(language, "Per-form totals", "คะแนนรวมแยกตามฟอร์ม")}:`,
      ...totalsByFormType.map(([formType, score]) => `- ${formType}: ${score}`),
    ];
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(t(language, "Score summary copied.", "คัดลอกสรุปคะแนนแล้ว"));
    } catch {
      setCopyMessage(t(language, "Could not copy automatically.", "ไม่สามารถคัดลอกอัตโนมัติได้"));
    }
    setTimeout(() => setCopyMessage(null), 2200);
  };

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="text-lg font-semibold text-slate-900">{t(language, "Export student scores & feedback", "ส่งออกคะแนนและข้อเสนอแนะของนักศึกษา")}</h2>
      <p className="mt-1 text-sm text-slate-600">
        Enter a <strong>Student ID</strong> and load preview. <strong>CSV (by field)</strong> and{" "}
        <strong>Excel</strong> use a <strong>tidy layout</strong>: each score or text field is its own row (Field
        name + Value), so you do not get huge sheets of empty cells. Optional <strong>CSV (wide)</strong> is a
        classic table with <em>only columns that have data</em> for this student.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block min-w-[200px] flex-1">
            <span className="mb-1 block text-sm font-medium text-slate-700">{t(language, "Student ID", "รหัสนักศึกษา")}</span>
            <input
              type="text"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyFilter();
                }
              }}
              placeholder={t(language, "e.g. same value as in Users / assessments", "เช่น รหัสเดียวกับในตาราง Users / assessments")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            onClick={applyFilter}
            disabled={assessmentLoading || !studentIdInput.trim()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t(language, "Load preview", "โหลดตัวอย่าง")}
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={runExportCsvByField}
            disabled={!canExport}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t(language, "CSV (by field — recommended)", "CSV (แยกตามฟิลด์ — แนะนำ)")}
          </button>
          <button
            type="button"
            onClick={runExportCsvWide}
            disabled={!canExport}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t(language, "CSV (wide, sparse columns removed)", "CSV (แบบตารางกว้าง, ตัดคอลัมน์ว่าง)")}
          </button>
          <button
            type="button"
            onClick={runExportExcel}
            disabled={!canExport}
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t(language, "Excel (Summary + by field)", "Excel (สรุป + แยกตามฟิลด์)")}
          </button>
        </div>
      </div>

      {assessmentError ? (
        <p className="mt-3 text-sm text-rose-700">
          Cannot load assessment data: {assessmentError}. Fix admin RLS / connection before exporting.
        </p>
      ) : null}

      {assessmentLoading ? (
        <p className="mt-3 text-sm text-slate-500">Loading assessment data…</p>
      ) : null}

      {appliedId && !assessmentLoading ? (
        <p className="mt-3 text-sm text-slate-700">
          <span className="font-medium">Student ID:</span> {appliedId}
          <span className="ml-2 text-slate-600">
            — {matchedRows.length} assessment{matchedRows.length === 1 ? "" : "s"} found
          </span>
        </p>
      ) : null}

      {appliedId && !assessmentLoading && matchedRows.length === 0 && !assessmentError ? (
        <p className="mt-3 text-sm text-amber-800">
          No assessments in the loaded data for this Student ID. Check the ID or clear the main dashboard search
          filter so all assessments are loaded.
        </p>
      ) : null}

      {matchedRows.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                {t(language, "Grand total score", "คะแนนรวมทั้งหมด")}: {grandTotalScore}
              </p>
              <button
                type="button"
                onClick={() => void handleCopyScoreSummary()}
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {t(language, "Copy score summary", "คัดลอกสรุปคะแนน")}
              </button>
            </div>
            {totalsByFormType.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-700">
                {totalsByFormType.map(([formType, score]) => (
                  <span key={formType} className="rounded-full border border-slate-200 bg-white px-2 py-0.5">
                    {formType}: {score}
                  </span>
                ))}
              </div>
            ) : null}
            {copyMessage ? <p className="mt-1 text-xs text-emerald-700">{copyMessage}</p> : null}
          </div>
          <div className="border-b border-slate-100 bg-white px-3 py-3 text-sm text-slate-800">
            <p className="font-semibold">{t(language, "Recent activity tracker", "ตัวติดตามกิจกรรมล่าสุด")}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                {t(language, "Last 7 days", "7 วันที่ผ่านมา")}: {recentActivity.count7}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                {t(language, "Last 30 days", "30 วันที่ผ่านมา")}: {recentActivity.count30}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                {t(language, "Total records", "รายการทั้งหมด")}: {matchedRows.length}
              </span>
            </div>
            {recentActivity.latestRows.length > 0 ? (
              <div className="mt-2 space-y-1 text-xs text-slate-700">
                <p className="font-medium">{t(language, "Latest submissions", "การส่งล่าสุด")}</p>
                {recentActivity.latestRows.map(({ row, ms }, index) => {
                  const form = pickString(row, ["Form Type", "form_type"]) || "—";
                  const status = pickString(row, ["Status", "status"]) || "—";
                  const dateText =
                    ms == null
                      ? "—"
                      : new Date(ms).toLocaleDateString(undefined, { dateStyle: "medium" });
                  return (
                    <p key={`latest-${index}`}>
                      {dateText} · {form} · {status}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-3">Form</th>
                <th className="px-3 py-3">{t(language, "Total score", "คะแนนรวม")}</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">{t(language, "Department", "แผนก")}</th>
                <th className="px-3 py-3">{t(language, "Created by", "ผู้สร้างแบบประเมิน")}</th>
                <th className="px-3 py-3">Student self-reflection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {matchedRows.map((row, index) => {
                const form = pickString(row, ["Form Type", "form_type"]);
                const status = pickString(row, ["Status", "status"]);
                const department = pickString(row, ["Department/Rotation", "Department"]);
                const createdBy = pickString(row, ["Evaluator Email", "evaluator_email", "Staff ID", "StaffID"]);
                const refl = pickString(row, [STUDENT_SELF_REFLECTION_COLUMN, "Student Self-Reflection"]);
                const rid = pickAssessmentRowId(row as Record<string, unknown>);
                return (
                  <tr key={rid || `export-${index}`} className="align-top text-slate-800">
                    <td className="px-3 py-2 font-medium">{form || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600 tabular-nums">
                      {formatAssessmentScoreWithFull(row)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {formatAssessmentRowDateDisplay(row as Record<string, unknown>)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{status || "—"}</td>
                    <td className="max-w-[min(24rem,30vw)] px-3 py-2 text-slate-600" title={department}>
                      {department || "—"}
                    </td>
                    <td className="max-w-[min(28rem,40vw)] px-3 py-2 text-slate-600" title={createdBy}>
                      {createdBy ? snippet(createdBy) : "—"}
                    </td>
                    <td className="max-w-[min(28rem,40vw)] px-3 py-2 text-slate-600" title={refl}>
                      {refl ? snippet(refl) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Exports include every filled score and text field for this student in the &quot;by field&quot; layout;
            wide CSV drops columns that are empty across all of this student&apos;s rows.
          </p>
        </div>
      ) : null}
    </div>
  );
}
