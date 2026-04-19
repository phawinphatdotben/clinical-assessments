"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  buildCsvContent,
  buildLongFormatExportRows,
  buildPrunedSummaryRows,
  buildPrunedWideExport,
  filterAssessmentsByExactStudentId,
  formatAssessmentRowDateDisplay,
  sanitizeExportFilenamePart,
} from "../lib/admin-assessment-export";
import { pickAssessmentRowId, STUDENT_SELF_REFLECTION_COLUMN } from "../lib/student-feedback";

type AssessmentRow = Record<string, unknown>;

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
  const [studentIdInput, setStudentIdInput] = useState("");
  const [appliedId, setAppliedId] = useState("");

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

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="text-lg font-semibold text-slate-900">Export student scores & feedback</h2>
      <p className="mt-1 text-sm text-slate-600">
        Enter a <strong>Student ID</strong> and load preview. <strong>CSV (by field)</strong> and{" "}
        <strong>Excel</strong> use a <strong>tidy layout</strong>: each score or text field is its own row (Field
        name + Value), so you do not get huge sheets of empty cells. Optional <strong>CSV (wide)</strong> is a
        classic table with <em>only columns that have data</em> for this student.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block min-w-[200px] flex-1">
            <span className="mb-1 block text-sm font-medium text-slate-700">Student ID</span>
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
              placeholder="e.g. same value as in Users / assessments"
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
            Load preview
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={runExportCsvByField}
            disabled={!canExport}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            CSV (by field — recommended)
          </button>
          <button
            type="button"
            onClick={runExportCsvWide}
            disabled={!canExport}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            CSV (wide, sparse columns removed)
          </button>
          <button
            type="button"
            onClick={runExportExcel}
            disabled={!canExport}
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Excel (Summary + by field)
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
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-3">Form</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">What went well</th>
                <th className="px-3 py-3">Areas to improve</th>
                <th className="px-3 py-3">Student self-reflection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {matchedRows.map((row, index) => {
                const form = pickString(row, ["Form Type", "form_type"]);
                const status = pickString(row, ["Status", "status"]);
                const well = pickString(row, ["Evaluator Feedback: What went well"]);
                const improve = pickString(row, ["Evaluator Feedback: Areas to improve"]);
                const refl = pickString(row, [STUDENT_SELF_REFLECTION_COLUMN, "Student Self-Reflection"]);
                const rid = pickAssessmentRowId(row as Record<string, unknown>);
                return (
                  <tr key={rid || `export-${index}`} className="align-top text-slate-800">
                    <td className="px-3 py-2 font-medium">{form || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {formatAssessmentRowDateDisplay(row as Record<string, unknown>)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{status || "—"}</td>
                    <td className="max-w-[min(28rem,40vw)] px-3 py-2 text-slate-600" title={well}>
                      {well ? snippet(well) : "—"}
                    </td>
                    <td className="max-w-[min(28rem,40vw)] px-3 py-2 text-slate-600" title={improve}>
                      {improve ? snippet(improve) : "—"}
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
