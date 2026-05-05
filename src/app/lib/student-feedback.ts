import { supabase } from "./supabase";

/** Supabase column name and in-app form field key for the student's reflection text. */
export const STUDENT_SELF_REFLECTION_COLUMN = "Student Self-Reflection";

/** Supabase column for the calendar date by which self-reflection should be submitted (typically DATE, e.g. YYYY-MM-DD). */
export const SELF_REFLECTION_DEADLINE_COLUMN = "Self Reflection Deadline";

/** Days after assessment creation that the student has to complete self-reflection. */
export const SELF_REFLECTION_DEADLINE_DAYS = 10;

/** Form types that collect student self-reflection and use the staff → student completion workflow. */
export const STUDENT_FEEDBACK_FORM_TYPES = [
  "DOPS",
  "Case-Based Discussion",
  "MiniCEX",
  "Internal Medicine Health Education",
  "OB/GYNE Health Education",
] as const;

export type StudentFeedbackFormType = (typeof STUDENT_FEEDBACK_FORM_TYPES)[number];

export function formTypeUsesStudentFeedback(formType: string): boolean {
  return (STUDENT_FEEDBACK_FORM_TYPES as readonly string[]).includes(formType);
}

/** Student-submitted assessment waiting for staff to approve (see staff dashboard). */
export const ASSESSMENT_STATUS_PENDING_STAFF_APPROVAL = "Pending Staff Approval";

/** Stored in `Status` when self-reflection is still required. */
export const ASSESSMENT_STATUS_PENDING = "Pending";

/** Stored in `Status` after the student submits self-reflection. */
export const ASSESSMENT_STATUS_COMPLETE = "Complete";

/** Stored in `Status` when the attempt failed and the student must redo the form. */
export const ASSESSMENT_STATUS_FAIL = "Fail";

/** Earlier app values — still recognized when reading rows. */
export const LEGACY_STATUS_PENDING_STUDENT_FEEDBACK = "Pending Student Feedback";
export const LEGACY_STATUS_COMPLETED = "Completed";

/** Use when marking an assessment done after self-reflection (alias). */
export const STUDENT_FEEDBACK_COMPLETED_STATUS = ASSESSMENT_STATUS_COMPLETE;

export function isPendingSelfReflectionStatus(status: string): boolean {
  const lower = status.trim().toLowerCase();
  return (
    lower === ASSESSMENT_STATUS_PENDING.toLowerCase() ||
    lower === LEGACY_STATUS_PENDING_STUDENT_FEEDBACK.toLowerCase()
  );
}

export function normalizeAssessmentStatusLabel(status: string): "Pending" | "Complete" | "Fail" | "Other" {
  const s = status.trim();
  const lower = s.toLowerCase();
  if (lower === ASSESSMENT_STATUS_PENDING.toLowerCase() || lower === LEGACY_STATUS_PENDING_STUDENT_FEEDBACK.toLowerCase()) {
    return "Pending";
  }
  if (lower === ASSESSMENT_STATUS_COMPLETE.toLowerCase() || lower === LEGACY_STATUS_COMPLETED.toLowerCase()) {
    return "Complete";
  }
  if (lower === ASSESSMENT_STATUS_FAIL.toLowerCase()) {
    return "Fail";
  }
  return "Other";
}

/** How the student dashboard summarizes workflow (no scores): finished staff evaluations vs still waiting vs fail. */
export type StudentDashboardSummaryStatus = "Complete" | "Pending" | "Fail" | "Other";

const SUBMITTED_TO_STUDENT = "submitted";
const PENDING_STAFF_APPROVAL = "pending staff approval";

/**
 * Maps raw `Assessment.Status` to a student-facing label for the history table.
 * - Staff-evaluated forms often use "Submitted" → shown as Complete.
 * - Self-reflection workflow uses Pending / Complete / Fail as stored.
 */
export function getStudentDashboardSummaryStatus(statusRaw: string): StudentDashboardSummaryStatus {
  const lower = statusRaw.trim().toLowerCase();
  if (lower === ASSESSMENT_STATUS_FAIL.toLowerCase()) {
    return "Fail";
  }
  if (
    lower === ASSESSMENT_STATUS_COMPLETE.toLowerCase() ||
    lower === LEGACY_STATUS_COMPLETED.toLowerCase() ||
    lower === SUBMITTED_TO_STUDENT
  ) {
    return "Complete";
  }
  if (
    lower === ASSESSMENT_STATUS_PENDING.toLowerCase() ||
    lower === LEGACY_STATUS_PENDING_STUDENT_FEEDBACK.toLowerCase() ||
    lower === PENDING_STAFF_APPROVAL
  ) {
    return "Pending";
  }
  return "Other";
}

/** True if calendar date `deadlineRaw` (YYYY-MM-DD or ISO) is before today (local). */
export function isSelfReflectionDeadlinePassed(deadlineRaw: unknown): boolean {
  if (deadlineRaw == null || deadlineRaw === "") {
    return false;
  }
  const s = String(deadlineRaw).trim().slice(0, 10);
  const parts = s.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return false;
  }
  const deadlineDay = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return todayStart > deadlineDay;
}

export function formatSelfReflectionDeadline(deadlineRaw: unknown): string {
  if (deadlineRaw == null || deadlineRaw === "") {
    return "—";
  }
  const s = String(deadlineRaw).trim().slice(0, 10);
  const parts = s.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return String(deadlineRaw);
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

/** ISO date string YYYY-MM-DD for `from` + N days (local calendar). */
export function computeSelfReflectionDeadlineDateString(from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + SELF_REFLECTION_DEADLINE_DAYS);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const pickStudentId = (row: Record<string, unknown>): string => {
  const v = row["Student ID"] ?? row["StudentID"] ?? row["student_id"];
  if (typeof v === "string" && v.trim()) {
    return v.trim();
  }
  if (typeof v === "number") {
    return String(v);
  }
  return "";
};

export async function getStudentIdForCurrentUser(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return null;
  }
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .ilike("Email", user.email.trim().toLowerCase())
    .limit(1);
  if (error || !data?.length) {
    return null;
  }
  const id = pickStudentId(data[0] as Record<string, unknown>);
  return id || null;
}

/** Same as getStudentIdForCurrentUser but returns Supabase error for dashboard diagnostics. */
export async function getStudentIdForCurrentUserWithError(): Promise<{
  studentId: string | null;
  errorMessage: string | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { studentId: null, errorMessage: "Not signed in." };
  }
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .ilike("Email", user.email.trim().toLowerCase())
    .limit(1);
  if (error) {
    return { studentId: null, errorMessage: error.message };
  }
  if (!data?.length) {
    return {
      studentId: null,
      errorMessage:
        "No Users row found for your email. Check that your account exists and RLS allows reading your profile.",
    };
  }
  const id = pickStudentId(data[0] as Record<string, unknown>);
  if (!id) {
    return {
      studentId: null,
      errorMessage: "Your Users row has no Student ID set.",
    };
  }
  return { studentId: id, errorMessage: null };
}

/**
 * Possible Assessment primary-key column names in Supabase (your table may use only one).
 * If none exist, add a column (see supabase/assessment-add-primary-key.sql) or align names here.
 */
export const ASSESSMENT_ROW_ID_KEYS = [
  "id",
  "Assessment ID",
  "assessment_id",
  "ID",
] as const;

/** Value used in URLs and React keys for one assessment row. */
export function pickAssessmentRowId(row: Record<string, unknown>): string {
  for (const key of ASSESSMENT_ROW_ID_KEYS) {
    const v = row[key];
    if (v == null || v === "") {
      continue;
    }
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
    if (typeof v === "number" && !Number.isNaN(v)) {
      return String(v);
    }
    const s = String(v).trim();
    if (s) {
      return s;
    }
  }
  return "";
}

/**
 * SELECT lists to try for dashboard history.
 * Prefer `*` first so default `created_at` / `updated_at` are always returned when they exist.
 * Avoid a column list with no timestamps — that made "Date completed" always show as "—".
 */
export const ASSESSMENT_HISTORY_SELECT_ATTEMPTS = [
  "*",
  'id, "Form Type", Status, "Staff ID", created_at, updated_at',
  '"Assessment ID", "Form Type", Status, "Staff ID", created_at, updated_at',
  '"Form Type", Status, "Staff ID", created_at, updated_at',
] as const;

/** Best-effort timestamp for display (PostgREST usually sends snake_case). */
export function pickAssessmentRowTimestampRaw(row: Record<string, unknown>): unknown {
  for (const key of ["updated_at", "created_at", "updatedAt", "createdAt"] as const) {
    const v = row[key];
    if (v != null && v !== "") {
      return v;
    }
  }
  return null;
}

export function formatAssessmentDateMedium(raw: unknown): string {
  if (raw == null || raw === "") {
    return "—";
  }
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

/** Load one assessment by route id, trying each known PK column until PostgREST accepts the filter. */
export async function fetchAssessmentByRouteId(routeId: string): Promise<{
  data: Record<string, unknown> | null;
  idColumn: string | null;
  errorMessage: string | null;
}> {
  let lastMissingColumnMessage: string | null = null;
  for (const col of ASSESSMENT_ROW_ID_KEYS) {
    const { data, error } = await supabase
      .from("Assessment")
      .select("*")
      .eq(col, routeId)
      .maybeSingle();
    if (!error && data) {
      return { data: data as Record<string, unknown>, idColumn: col, errorMessage: null };
    }
    if (error) {
      const msg = error.message;
      if (/does not exist|schema cache/i.test(msg)) {
        lastMissingColumnMessage = msg;
        continue;
      }
      return { data: null, idColumn: null, errorMessage: msg };
    }
  }
  return {
    data: null,
    idColumn: null,
    errorMessage: lastMissingColumnMessage ?? "Assessment not found.",
  };
}

/** Narrow columns for the student dashboard table (tries SELECT lists until one matches your schema). */
export async function fetchAssessmentHistoryRows(studentId: string): Promise<{
  rows: Record<string, unknown>[];
  errorMessage: string | null;
}> {
  let lastError: string | null = null;
  for (const sel of ASSESSMENT_HISTORY_SELECT_ATTEMPTS) {
    const { data, error } = await supabase
      .from("Assessment")
      // Dynamic column list: schema differs per project (id vs "Assessment ID", optional timestamps).
      .select(sel as "*")
      .eq("Student ID", studentId);
    if (!error) {
      return { rows: (data ?? []) as Record<string, unknown>[], errorMessage: null };
    }
    lastError = error.message;
    if (!/does not exist|schema cache/i.test(error.message)) {
      return { rows: [], errorMessage: error.message };
    }
  }
  return { rows: [], errorMessage: lastError };
}

/** Map `Form Type` value to student form URL slug. */
export function getStudentFormSlugForAssessmentFormType(formType: string): string | null {
  switch (formType) {
    case "DOPS":
      return "dops";
    case "Case-Based Discussion":
      return "cbd";
    case "MiniCEX":
      return "minicex";
    case "Internal Medicine Health Education":
      return "health-ed-im";
    case "OB/GYNE Health Education":
      return "health-ed-obgyn";
    default:
      return null;
  }
}
