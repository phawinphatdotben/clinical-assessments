import { CRITERIA_SCORE_SUM_COLUMN, pickStoredOrComputedScoreSum } from "./assessment-score-summation";
import {
  pickAssessmentRowId,
  SELF_REFLECTION_DEADLINE_COLUMN,
  STUDENT_SELF_REFLECTION_COLUMN,
} from "./student-feedback";

/** Columns shown first in wide exports (readable order); remaining keys follow alphabetically. */
export const ADMIN_EXPORT_COLUMN_PRIORITY: string[] = [
  "Student ID",
  "Form Type",
  "Status",
  "created_at",
  "updated_at",
  "Staff ID",
  "Evaluator Email",
  "Hospital",
  "Department/Rotation",
  "Evaluator Role",
  "Evaluator Name",
  "Setting",
  "Case Complexity",
  "Procedure Name",
  "Patient HN",
  "Overall Performance Result",
  CRITERIA_SCORE_SUM_COLUMN,
  "Evaluator Feedback: What went well",
  "Evaluator Feedback: Areas to improve",
  STUDENT_SELF_REFLECTION_COLUMN,
  SELF_REFLECTION_DEADLINE_COLUMN,
];

/** Shown as columns in long-format rows; same keys are not repeated as Field name rows. */
const LONG_FORMAT_SKIP_FIELD_KEYS = new Set([
  "Student ID",
  "StudentID",
  "student_id",
  "Form Type",
  "form_type",
  "Status",
  "status",
  "created_at",
  "updated_at",
]);

function pickStudentIdFromRow(row: Record<string, unknown>): string {
  for (const key of ["Student ID", "StudentID", "student_id"] as const) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
    if (typeof v === "number" && !Number.isNaN(v)) {
      return String(v);
    }
  }
  return "";
}

export function filterAssessmentsByExactStudentId(
  rows: Record<string, unknown>[],
  studentId: string
): Record<string, unknown>[] {
  const target = studentId.trim();
  if (!target) {
    return [];
  }
  return rows.filter((r) => pickStudentIdFromRow(r) === target);
}

export function formatExportCell(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Remove columns where every cell is empty (after trim). */
export function dropAllEmptyColumns(
  columns: string[],
  rows: Record<string, string>[]
): { columns: string[]; rowsOut: Record<string, string>[] } {
  if (rows.length === 0) {
    return { columns: [], rowsOut: [] };
  }
  const keep = columns.filter((c) => rows.some((r) => (r[c] ?? "").trim() !== ""));
  const pruned = rows.map((r) => {
    const o: Record<string, string> = {};
    for (const k of keep) {
      o[k] = r[k] ?? "";
    }
    return o;
  });
  return { columns: keep, rowsOut: pruned };
}

export function buildAdminExportDataset(rows: Record<string, unknown>[]): {
  columns: string[];
  rowsOut: Record<string, string>[];
} {
  const keySet = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      keySet.add(k);
    }
  }
  /* Always allow this column in wide exports even if PostgREST omits null keys. */
  keySet.add(CRITERIA_SCORE_SUM_COLUMN);

  const priority = ADMIN_EXPORT_COLUMN_PRIORITY.filter((k) => keySet.has(k));
  const rest = [...keySet].filter((k) => !priority.includes(k)).sort((a, b) => a.localeCompare(b));
  const columns = [...priority, ...rest];

  const rowsOut = rows.map((row) => {
    const out: Record<string, string> = {};
    for (const col of columns) {
      out[col] =
        col === CRITERIA_SCORE_SUM_COLUMN ? pickStoredOrComputedScoreSum(row) : formatExportCell(row[col]);
    }
    return out;
  });

  return { columns, rowsOut };
}

/** Wide table with only columns that have at least one non-empty value. */
export function buildPrunedWideExport(rows: Record<string, unknown>[]): {
  columns: string[];
  rowsOut: Record<string, string>[];
} {
  const { columns, rowsOut } = buildAdminExportDataset(rows);
  return dropAllEmptyColumns(columns, rowsOut);
}

/**
 * One row per non-empty field (easy to read in Excel—no huge blocks of nulls).
 * Omits repeating Student ID / Form Type / Status / dates as "Field" rows (they stay as columns).
 */
export function buildLongFormatExportRows(rows: Record<string, unknown>[]): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  rows.forEach((row, index) => {
    const assessmentId = pickAssessmentRowId(row) || `#${index + 1}`;
    const studentId = pickStudentIdFromRow(row);
    const formType = formatExportCell(row["Form Type"] ?? row["form_type"]);
    const status = formatExportCell(row["Status"] ?? row["status"]);
    const recorded = formatExportCell(row.updated_at ?? row.created_at ?? "");

    const keys = Object.keys(row).sort((a, b) => a.localeCompare(b));
    for (const key of keys) {
      if (LONG_FORMAT_SKIP_FIELD_KEYS.has(key)) {
        continue;
      }
      if (key === CRITERIA_SCORE_SUM_COLUMN) {
        continue;
      }
      const val = formatExportCell(row[key]);
      if (!val.trim()) {
        continue;
      }
      out.push({
        "Assessment ID": assessmentId,
        "Student ID": studentId,
        "Form Type": formType,
        "Status": status,
        "Recorded date": recorded,
        "Field name": key,
        Value: val,
      });
    }

    const scoreSum = pickStoredOrComputedScoreSum(row);
    if (scoreSum.trim()) {
      out.push({
        "Assessment ID": assessmentId,
        "Student ID": studentId,
        "Form Type": formType,
        "Status": status,
        "Recorded date": recorded,
        "Field name": CRITERIA_SCORE_SUM_COLUMN,
        Value: scoreSum,
      });
    }
  });
  return out;
}

/** One row per assessment: main narrative + IDs only (for Excel summary sheet). */
export function buildSummarySheetRows(rows: Record<string, unknown>[]): Record<string, string>[] {
  return rows.map((row, index) => ({
    "Assessment ID": pickAssessmentRowId(row) || `#${index + 1}`,
    "Student ID": pickStudentIdFromRow(row),
    "Form Type": formatExportCell(row["Form Type"] ?? row["form_type"]),
    "Status": formatExportCell(row["Status"] ?? row["status"]),
    "Recorded date": formatExportCell(row.updated_at ?? row.created_at ?? ""),
    "Staff ID": formatExportCell(row["Staff ID"] ?? row["StaffID"]),
    "Hospital": formatExportCell(row["Hospital"]),
    "Department/Rotation": formatExportCell(row["Department/Rotation"] ?? row["Department"]),
    "Evaluator Role": formatExportCell(row["Evaluator Role"]),
    "Overall Performance Result": formatExportCell(row["Overall Performance Result"]),
    [CRITERIA_SCORE_SUM_COLUMN]: pickStoredOrComputedScoreSum(row),
    "Evaluator Feedback: What went well": formatExportCell(row["Evaluator Feedback: What went well"]),
    "Evaluator Feedback: Areas to improve": formatExportCell(row["Evaluator Feedback: Areas to improve"]),
    [STUDENT_SELF_REFLECTION_COLUMN]: formatExportCell(row[STUDENT_SELF_REFLECTION_COLUMN]),
    "Self Reflection Deadline": formatExportCell(row[SELF_REFLECTION_DEADLINE_COLUMN]),
  }));
}

export function buildPrunedSummaryRows(rows: Record<string, unknown>[]): {
  columns: string[];
  rowsOut: Record<string, string>[];
} {
  if (rows.length === 0) {
    return { columns: [], rowsOut: [] };
  }
  const raw = buildSummarySheetRows(rows);
  const columns = Object.keys(raw[0]);
  return dropAllEmptyColumns(columns, raw);
}

function escapeCsvField(value: string): string {
  const t = value.replace(/"/g, '""');
  if (/[",\n\r]/.test(t)) {
    return `"${t}"`;
  }
  return t;
}

/** UTF-8 BOM so Excel opens Thai / UTF-8 correctly on Windows. */
export function buildCsvContent(columns: string[], rows: Record<string, string>[]): string {
  if (columns.length === 0) {
    return "\ufeff";
  }
  const header = columns.map(escapeCsvField).join(",");
  const lines = [header];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvField(row[c] ?? "")).join(","));
  }
  return "\ufeff" + lines.join("\r\n");
}

export function sanitizeExportFilenamePart(id: string): string {
  return id.trim().replace(/[^\w\-]+/g, "_").slice(0, 64) || "student";
}

export function formatAssessmentRowDateDisplay(row: Record<string, unknown>): string {
  const raw = row.updated_at ?? row.created_at;
  if (raw == null || raw === "") {
    return "—";
  }
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}
