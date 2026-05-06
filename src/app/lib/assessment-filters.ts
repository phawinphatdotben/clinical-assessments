import { supabase } from "./supabase";
import {
  ASSESSMENT_STATUS_COMPLETE,
  ASSESSMENT_STATUS_COMPLETE_FAIL,
  LEGACY_STATUS_COMPLETED,
  getStudentDashboardSummaryStatus,
} from "./student-feedback";

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

export type UserDirectoryLookup = {
  byEmail: Map<string, Record<string, unknown>>;
  byStudentId: Map<string, Record<string, unknown>>;
  byStaffId: Map<string, Record<string, unknown>>;
};

export function emptyUserDirectoryLookup(): UserDirectoryLookup {
  return {
    byEmail: new Map(),
    byStudentId: new Map(),
    byStaffId: new Map(),
  };
}

/** All assessment rows (admin only; requires RLS policy). */
export async function fetchAllAssessmentsForAdmin(): Promise<{
  rows: Record<string, unknown>[];
  errorMessage: string | null;
}> {
  const { data, error } = await supabase.from("Assessment").select("*");
  if (error) {
    return { rows: [], errorMessage: error.message };
  }
  return { rows: (data ?? []) as Record<string, unknown>[], errorMessage: null };
}

/** Load approved Users rows for name / ID / email matching on assessments. */
export async function fetchApprovedUsersDirectory(): Promise<{
  lookup: UserDirectoryLookup;
  errorMessage: string | null;
}> {
  const { data, error } = await supabase
    .from("Users")
    .select('"Email", "Name", "Student ID", "Staff ID", Status')
    .eq("Status", "Approved");

  if (error) {
    return {
      lookup: {
        byEmail: new Map(),
        byStudentId: new Map(),
        byStaffId: new Map(),
      },
      errorMessage: error.message,
    };
  }

  const byEmail = new Map<string, Record<string, unknown>>();
  const byStudentId = new Map<string, Record<string, unknown>>();
  const byStaffId = new Map<string, Record<string, unknown>>();

  for (const raw of data ?? []) {
    const row = raw as Record<string, unknown>;
    const em = pickString(row, ["Email", "email"]).toLowerCase();
    if (em) {
      byEmail.set(em, row);
    }
    const sid = pickString(row, ["Student ID", "StudentID", "student_id"]);
    if (sid) {
      byStudentId.set(sid, row);
    }
    const stid = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
    if (stid) {
      byStaffId.set(stid, row);
    }
  }

  return {
    lookup: { byEmail, byStudentId, byStaffId },
    errorMessage: null,
  };
}

function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

/** Collect searchable text for an assessment row + linked Users names. */
export function collectAssessmentSearchHaystack(
  row: Record<string, unknown>,
  lookup: UserDirectoryLookup
): string {
  const parts: string[] = [];

  const studentId = pickString(row, ["Student ID", "StudentID", "student_id"]);
  const staffId = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
  const evalEmail = pickString(row, ["Evaluator Email", "EvaluatorEmail", "evaluator_email"]);
  parts.push(
    studentId,
    staffId,
    evalEmail,
    pickString(row, ["Form Type", "form_type"]),
    pickString(row, ["Hospital", "hospital"]),
    pickString(row, ["Department/Rotation", "Department"])
  );

  const su = studentId ? lookup.byStudentId.get(studentId) : undefined;
  if (su) {
    parts.push(pickString(su, ["Name", "name"]), pickString(su, ["Email", "email"]));
  }
  const st = staffId ? lookup.byStaffId.get(staffId) : undefined;
  if (st) {
    parts.push(pickString(st, ["Name", "name"]), pickString(st, ["Email", "email"]));
  }
  if (evalEmail) {
    const u = lookup.byEmail.get(normalizeEmail(evalEmail));
    if (u) {
      parts.push(pickString(u, ["Name", "name"]));
    }
  }

  return parts.filter(Boolean).join(" \u0001 ");
}

/** Case-insensitive substring match across IDs, emails, names on the row (and linked Users). */
export function assessmentMatchesSearchQuery(
  row: Record<string, unknown>,
  query: string,
  lookup: UserDirectoryLookup
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const hay = collectAssessmentSearchHaystack(row, lookup).toLowerCase();
  return hay.includes(q);
}

export function sortAssessmentsRecentFirst<T extends Record<string, unknown>>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ta = new Date(String(a.updated_at ?? a.created_at ?? 0)).getTime();
    const tb = new Date(String(b.updated_at ?? b.created_at ?? 0)).getTime();
    return tb - ta;
  });
}

/** Apply search; empty query ⇒ recent first only (all rows pass filter). */
export function filterAssessmentsByPersonSearch<T extends Record<string, unknown>>(
  rows: T[],
  query: string,
  lookup: UserDirectoryLookup
): T[] {
  const filtered = rows.filter((r) => assessmentMatchesSearchQuery(r as Record<string, unknown>, query, lookup));
  return sortAssessmentsRecentFirst(filtered);
}

/** Completed / closed assessments suitable for portfolio counts. */
export function isAssessmentCompleteForPortfolio(statusRaw: string): boolean {
  const s = statusRaw.trim().toLowerCase();
  if (
    s === ASSESSMENT_STATUS_COMPLETE.toLowerCase() ||
    s === LEGACY_STATUS_COMPLETED.toLowerCase() ||
    s === ASSESSMENT_STATUS_COMPLETE_FAIL.toLowerCase() ||
    s === "complete - fail" ||
    s === "complete-fail"
  ) {
    return true;
  }
  if (s === "submitted") {
    return true;
  }
  const summary = getStudentDashboardSummaryStatus(statusRaw);
  return summary === "Complete" || summary === "CompleteFail";
}

const DEPT_KEYS = ["Department/Rotation", "Department", "department"];

export function pickDepartmentLabel(row: Record<string, unknown>): string {
  const d = pickString(row, DEPT_KEYS);
  return d.trim() || "Unknown";
}

/** Workplace-based forms only (matches `Form Type` on Assessment / WPBA config). */
export type WpbaPortfolioFormKey = "MiniCEX" | "CbD" | "DOPS";

/**
 * Maps stored form type to MiniCEX / CbD / DOPS. Other types (e.g. MSF, JC) return null.
 * Recognizes "Case-Based Discussion" (stored by CbD forms) and "CbD".
 */
export function normalizeFormTypeToWpbaPortfolio(formTypeRaw: string): WpbaPortfolioFormKey | null {
  const s = formTypeRaw.trim().toLowerCase();
  if (!s) {
    return null;
  }
  if (s === "dops") {
    return "DOPS";
  }
  if (s === "minicex") {
    return "MiniCEX";
  }
  if (s === "case-based discussion" || s === "cbd") {
    return "CbD";
  }
  return null;
}

export type DepartmentWpbaStack = {
  department: string;
  MiniCEX: number;
  CbD: number;
  DOPS: number;
  total: number;
};

/** Completed MiniCEX / CbD / DOPS only, stacked counts per department (rotation). */
export function aggregateCompletedWpbaByDepartment(rows: Record<string, unknown>[]): DepartmentWpbaStack[] {
  const map = new Map<string, { MiniCEX: number; CbD: number; DOPS: number }>();
  for (const row of rows) {
    const status = pickString(row, ["Status", "status"]);
    if (!isAssessmentCompleteForPortfolio(status)) {
      continue;
    }
    const formType = pickString(row, ["Form Type", "form_type"]);
    const bucket = normalizeFormTypeToWpbaPortfolio(formType);
    if (!bucket) {
      continue;
    }
    const dept = pickDepartmentLabel(row);
    let entry = map.get(dept);
    if (!entry) {
      entry = { MiniCEX: 0, CbD: 0, DOPS: 0 };
      map.set(dept, entry);
    }
    entry[bucket] += 1;
  }
  return Array.from(map.entries())
    .map(([department, counts]) => ({
      department,
      MiniCEX: counts.MiniCEX,
      CbD: counts.CbD,
      DOPS: counts.DOPS,
      total: counts.MiniCEX + counts.CbD + counts.DOPS,
    }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);
}
